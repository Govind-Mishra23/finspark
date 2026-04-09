const express = require('express');
const router = express.Router();
const { getEventModel } = require('../models/Event');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const AI_REPORT_CACHE_TTL_MS = Number(process.env.AI_REPORT_CACHE_TTL_MS || 120000);
const AI_QUOTA_COOLDOWN_MS = Number(process.env.AI_QUOTA_COOLDOWN_MS || 60000);
const AI_GENERATION_TIMEOUT_MS = Number(process.env.AI_GENERATION_TIMEOUT_MS || 45000); // 45s to give Gemini enough time
const DEFAULT_GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-8b',
];

const aiGrowthCache = new Map();
const aiGrowthQuotaCooldown = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryDelayMs = (err) => {
  const retryInfo = err?.errorDetails?.find((d) => d?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
  const retryDelay = retryInfo?.retryDelay;
  if (!retryDelay || typeof retryDelay !== 'string') return null;

  const match = retryDelay.match(/^(\d+)(?:\.(\d+))?s$/);
  if (!match) return null;

  const seconds = Number(match[1]);
  const fraction = match[2] ? Number(`0.${match[2]}`) : 0;
  return Math.max(0, Math.round((seconds + fraction) * 1000));
};

const isQuotaExceededError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return err?.status === 429 || msg.includes('quota') || msg.includes('too many requests');
};

const isModelUnavailableError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return (
    err?.status === 404 ||
    msg.includes('not found for api version') ||
    msg.includes('is not found for api version') ||
    msg.includes('model not found') ||
    msg.includes('unsupported for generatecontent')
  );
};

const getGeminiModelCandidates = () => {
  const envModel = (process.env.GEMINI_MODEL || '').trim();
  const envCandidates = (process.env.GEMINI_MODEL_CANDIDATES || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

  const ordered = [
    ...(envModel ? [envModel] : []),
    ...envCandidates,
    ...DEFAULT_GEMINI_MODEL_CANDIDATES,
  ];

  return [...new Set(ordered)];
};

const buildAiGrowthCacheKey = (tenantId, days) => `${tenantId}:${days}`;

const getCachedAiGrowth = (cacheKey) => {
  const cached = aiGrowthCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    aiGrowthCache.delete(cacheKey);
    return null;
  }
  return cached.payload;
};

const setCachedAiGrowth = (cacheKey, payload, ttlMs = AI_REPORT_CACHE_TTL_MS) => {
  aiGrowthCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttlMs,
  });
};

const getQuotaCooldownRemainingMs = (cacheKey) => {
  const until = aiGrowthQuotaCooldown.get(cacheKey) || 0;
  if (until <= Date.now()) {
    aiGrowthQuotaCooldown.delete(cacheKey);
    return 0;
  }
  return until - Date.now();
};

const setQuotaCooldown = (cacheKey, delayMs = AI_QUOTA_COOLDOWN_MS) => {
  const safeDelay = Math.max(1000, delayMs);
  aiGrowthQuotaCooldown.set(cacheKey, Date.now() + safeDelay);
};

const withTimeout = async (promise, timeoutMs) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const timeoutError = new Error('Gemini generation timed out');
          timeoutError.code = 'AI_TIMEOUT';
          reject(timeoutError);
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const logAiGrowthResponse = (tenantId, source, payload, extras = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[ai-growth][${timestamp}][tenant=${tenantId}][source=${source}]`, extras);
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ source, rawMetrics: payload?.rawMetrics, aiMeta: payload?.ai, _debug: payload?._debug }, null, 2));
  }
};

const buildQuotaFallbackReport = (metrics) => {
  const { applyClicked, documentUpload, kycStarted, loanApproved } = metrics.funnel;
  const applyToDocDrop = applyClicked > 0 ? Math.round(((applyClicked - documentUpload) / applyClicked) * 100) : 0;
  const docToKycDrop = documentUpload > 0 ? Math.round(((documentUpload - kycStarted) / documentUpload) * 100) : 0;
  const kycToApprovalDrop = kycStarted > 0 ? Math.round(((kycStarted - loanApproved) / kycStarted) * 100) : 0;
  const conversionRate = applyClicked > 0 ? Math.round((loanApproved / applyClicked) * 100) : 0;

  const stageDrops = [
    { stage: 'Apply to Document Upload', value: applyToDocDrop },
    { stage: 'Document Upload to KYC', value: docToKycDrop },
    { stage: 'KYC to Approval', value: kycToApprovalDrop }
  ];
  const highestDrop = stageDrops.sort((a, b) => b.value - a.value)[0];

  return {
    criticalIssues: [
      `${highestDrop.stage} has the highest funnel leakage at ${highestDrop.value}%.`,
      `Overall approval conversion is currently ${conversionRate}% from apply to approved.`
    ],
    performanceSummary: `AI quota was temporarily exceeded, so this report is generated from deterministic rules over live telemetry. You have ${metrics.activeUsers} active users and ${metrics.totalEvents} events, with ${metrics.topFeature.replace(/_/g, ' ')} as the top interaction.`,
    funnelAnalysis: `Drop-offs are Apply->Document ${applyToDocDrop}%, Document->KYC ${docToKycDrop}%, and KYC->Approval ${kycToApprovalDrop}%. Prioritize instrumentation and UX improvements at the largest drop stage to improve end-to-end conversion.`,
    anomalies: [
      metrics.topFeatureCount <= 1
        ? 'Top feature usage is very low, indicating shallow product engagement.'
        : `Top feature concentration: ${metrics.topFeature.replace(/_/g, ' ')} was used ${metrics.topFeatureCount} times.`,
      applyClicked > 0 && loanApproved === 0
        ? 'Applications are starting but no approvals are being completed.'
        : 'No severe data anomaly detected beyond normal funnel leakage.'
    ],
    recommendations: [
      {
        title: `Fix ${highestDrop.stage} friction`,
        description: 'Review event payloads, form validation failures, and API latency around this step. Add session replay or verbose diagnostics for abandonment reasons.',
        impact: 'High'
      },
      {
        title: 'Improve completion nudges',
        description: 'Trigger contextual reminders for users who start but do not complete the next required funnel step within 10-30 minutes.',
        impact: 'Medium'
      }
    ],
    growthOpportunities: [
      'A/B test a shorter application flow with progressive disclosure of optional fields.',
      'Build segmented onboarding journeys for first-time vs returning applicants based on event history.'
    ]
  };
};

const generateWithRetry = async (model, prompt, maxAttempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      lastError = err;

      if (!isQuotaExceededError(err) || attempt === maxAttempts) {
        throw err;
      }

      const suggestedDelay = parseRetryDelayMs(err);
      const backoffDelay = suggestedDelay ?? 1000 * (2 ** (attempt - 1));
      await sleep(backoffDelay);
    }
  }

  throw lastError;
};

// GET /api/analytics/feature-usage — Aggregated feature usage counts
router.get('/feature-usage', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());

    const result = await Event.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          _id: 0,
          feature: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feature usage.', details: err.message });
  }
});

// GET /api/analytics/funnel — Funnel / drop-off analysis
router.get('/funnel', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());

    const funnelSteps = [
      'Loan_Apply_Clicked',
      'Document_Upload_Started',
      'KYC_Verification_Started',
      'Loan_Approved',
    ];

    const result = await Event.aggregate([
      { 
        $match: { 
          timestamp: { $gte: since },
          eventName: { $in: funnelSteps }
        } 
      },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          _id: 0,
          step: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
    ]);

    // Order by funnel steps
    const ordered = funnelSteps.map((step, index) => {
      const found = result.find((r) => r.step === step);
      const users = found ? found.uniqueUsers : 0;
      const prev = index > 0
        ? (result.find((r) => r.step === funnelSteps[index - 1])?.uniqueUsers || 0)
        : users;

      return {
        step,
        label: step.replace(/_/g, ' '),
        count: found ? found.count : 0,
        uniqueUsers: users,
        dropOff: index > 0 && prev > 0
          ? Math.round(((prev - users) / prev) * 100)
          : 0,
      };
    });

    res.json({ data: ordered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch funnel data.', details: err.message });
  }
});

// GET /api/analytics/trends — Time-series feature usage
router.get('/trends', async (req, res) => {
  try {
    const { days = 14 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());

    const result = await Event.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            event: '$eventName',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          events: {
            $push: { event: '$_id.event', count: '$count' },
          },
          total: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          events: 1,
        },
      },
    ]);

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trends.', details: err.message });
  }
});

// GET /api/analytics/insights — Smart rule-based insights
router.get('/insights', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());

    // Get funnel data
    const funnelSteps = [
      'Loan_Apply_Clicked',
      'Document_Upload_Started',
      'KYC_Verification_Started',
      'Loan_Approved',
    ];

    const funnelData = await Event.aggregate([
      { 
        $match: { 
          timestamp: { $gte: since },
          eventName: { $in: funnelSteps } 
        } 
      },
      {
        $group: {
          _id: '$eventName',
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
    ]);

    const stepCounts = {};
    funnelData.forEach((s) => (stepCounts[s._id] = s.uniqueUsers.length));

    const insights = [];

    // KYC drop-off insight
    const kycUsers = stepCounts['KYC_Verification_Started'] || 0;
    const docUsers = stepCounts['Document_Upload_Started'] || 0;
    if (docUsers > 0) {
      const dropRate = Math.round(((docUsers - kycUsers) / docUsers) * 100);
      if (dropRate > 30) {
        insights.push({
          type: 'warning',
          title: 'High KYC Drop-off Detected',
          description: `${dropRate}% of users drop off between Document Upload and KYC Verification. Consider simplifying the KYC process or adding progress indicators.`,
          metric: `${dropRate}%`,
          category: 'funnel',
        });
      }
    }

    // Overall conversion insight
    const applyUsers = stepCounts['Loan_Apply_Clicked'] || 0;
    const approvedUsers = stepCounts['Loan_Approved'] || 0;
    if (applyUsers > 0) {
      const convRate = Math.round((approvedUsers / applyUsers) * 100);
      insights.push({
        type: convRate > 50 ? 'success' : 'info',
        title: 'Loan Conversion Rate',
        description: `${convRate}% of applicants complete the full loan journey. ${
          convRate < 50
            ? 'There is significant room for improvement in the funnel.'
            : 'The funnel is performing well.'
        }`,
        metric: `${convRate}%`,
        category: 'conversion',
      });
    }

    // Feature adoption insight
    const allFeatures = await Event.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$eventName',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (allFeatures.length > 0) {
      const top = allFeatures[0];
      const bottom = allFeatures[allFeatures.length - 1];
      insights.push({
        type: 'info',
        title: 'Feature Adoption Gap',
        description: `"${top._id.replace(/_/g, ' ')}" is the most used feature (${top.count} events), while "${bottom._id.replace(/_/g, ' ')}" has the lowest usage (${bottom.count} events). Consider promoting underused features.`,
        metric: `${top.count} vs ${bottom.count}`,
        category: 'adoption',
      });
    }

    // Total active users
    const totalUsers = await Event.distinct('userId', { timestamp: { $gte: since } });
    insights.push({
      type: 'success',
      title: 'Active User Base',
      description: `${totalUsers.length} unique users have interacted with the platform in the last ${days} days.`,
      metric: totalUsers.length.toString(),
      category: 'engagement',
    });

    res.json({ data: insights });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate insights.', details: err.message });
  }
});

// GET /api/analytics/summary — Dashboard KPI summary
router.get('/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());
    const match = { timestamp: { $gte: since } };

    const [totalEvents, uniqueUsers, topFeature, funnelStart, funnelEnd] = await Promise.all([
      Event.countDocuments(match),
      Event.distinct('userId', match),
      Event.aggregate([
        { $match: match },
        { $group: { _id: '$eventName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      Event.distinct('userId', { ...match, eventName: 'Loan_Apply_Clicked' }),
      Event.distinct('userId', { ...match, eventName: 'Loan_Approved' }),
    ]);

    const dropOffRate =
      funnelStart.length > 0
        ? Math.round(((funnelStart.length - funnelEnd.length) / funnelStart.length) * 100)
        : 0;

    res.json({
      data: {
        totalEvents,
        activeUsers: uniqueUsers.length,
        topFeature: topFeature[0]?._id?.replace(/_/g, ' ') || 'N/A',
        topFeatureCount: topFeature[0]?.count || 0,
        dropOffRate,
        conversionRate: 100 - dropOffRate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary.', details: err.message });
  }
});

// DELETE /api/analytics/reset — Clear all event data for fresh demo
router.delete('/reset', async (req, res) => {
  try {
    const Event = getEventModel(req.tenant._id.toString());
    const result = await Event.deleteMany({});
    res.json({ success: true, message: `Cleared ${result.deletedCount} events.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset data.', details: err.message });
  }
});

// GET /api/analytics/ai-growth — Generate actionable insights using Gemini
router.get('/ai-growth', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Gemini API Key is missing in the backend environment.', needsConfiguration: true });
    }

    const days = Number(req.query.days || 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const tenantId = req.tenant._id.toString();
    const cacheKey = buildAiGrowthCacheKey(tenantId, days);
    const Event = getEventModel(tenantId);
    const match = { timestamp: { $gte: since } };

    // Gather crucial data points
    const [totalEvents, uniqueUsers, [topFeature], funnelSteps] = await Promise.all([
      Event.countDocuments(match),
      Event.distinct('userId', match),
      Event.aggregate([
        { $match: match },
        { $group: { _id: '$eventName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      Event.aggregate([
        { $match: { ...match, eventName: { $in: ['Loan_Apply_Clicked', 'Document_Upload_Started', 'KYC_Verification_Started', 'Loan_Approved'] } } },
        { $group: { _id: '$eventName', uniqueUsers: { $addToSet: '$userId' } } }
      ])
    ]);

    const getFunnelCount = (stepName) => {
      const step = funnelSteps.find(s => s._id === stepName);
      return step ? step.uniqueUsers.length : 0;
    };

    const metrics = {
      activeUsers: uniqueUsers.length,
      totalEvents: totalEvents,
      topFeature: topFeature ? topFeature._id : 'None',
      topFeatureCount: topFeature ? topFeature.count : 0,
      funnel: {
        applyClicked: getFunnelCount('Loan_Apply_Clicked'),
        documentUpload: getFunnelCount('Document_Upload_Started'),
        kycStarted: getFunnelCount('KYC_Verification_Started'),
        loanApproved: getFunnelCount('Loan_Approved')
      }
    };

    // If there's barely any data, AI won't be useful
    if (metrics.activeUsers < 1 || metrics.funnel.applyClicked === 0) {
      const payload = {
        data: {
          criticalIssues: ["Insufficient Tracking Volume"],
          performanceSummary: "There is insufficient data to generate a meaningful predictive AI health check. Start simulating more traffic to unlock deeper insights.",
          funnelAnalysis: "No funnel activity detected to analyze.",
          anomalies: [],
          recommendations: [{ title: "Drive Traffic", description: "Use your live integration or the Loan Demo App more heavily to generate actionable interaction data.", impact: "High" }],
          growthOpportunities: ["Launch marketing campaigns to establish a baseline traction metric."]
        },
        rawMetrics: metrics,
        ai: { status: 'insufficient-data', provider: 'none', fallback: true },
        _debug: {
          source: 'insufficient-data',
          model: null,
          generatedAt: new Date().toISOString(),
          hint: 'Use the Loan Demo App or trigger more events via the SDK to populate analytics data.',
        }
      };
      logAiGrowthResponse(tenantId, 'insufficient-data', payload);
      return res.json(payload);
    }

    const cachedPayload = getCachedAiGrowth(cacheKey);
    if (cachedPayload) {
      // Annotate with cache hit info in debug
      const cachedWithDebug = {
        ...cachedPayload,
        _debug: {
          ...(cachedPayload._debug || {}),
          cachedAt: new Date().toISOString(),
          source: cachedPayload._debug?.source ? `${cachedPayload._debug.source} (cache-hit)` : 'cache-hit',
        }
      };
      logAiGrowthResponse(tenantId, 'cache-hit', cachedWithDebug);
      return res.json(cachedWithDebug);
    }

    const modelCandidates = getGeminiModelCandidates();
    const preferredModel = modelCandidates[0] || 'gemini-2.5-flash';
    const cooldownRemainingMs = getQuotaCooldownRemainingMs(cacheKey);
    if (cooldownRemainingMs > 0) {
      const fallbackPayload = {
        data: buildQuotaFallbackReport(metrics),
        rawMetrics: metrics,
        ai: {
          status: 'quota-cooldown',
          provider: 'gemini',
          fallback: true,
          cooldownRemainingMs,
        },
        _debug: {
          source: 'quota-cooldown',
          model: preferredModel,
          triedModels: modelCandidates,
          generatedAt: new Date().toISOString(),
          retryAfterMs: cooldownRemainingMs,
          hint: `Quota cooldown active. Retry in ${Math.round(cooldownRemainingMs / 1000)}s.`,
        }
      };
      setCachedAiGrowth(cacheKey, fallbackPayload, Math.min(cooldownRemainingMs, AI_REPORT_CACHE_TTL_MS));
      logAiGrowthResponse(tenantId, 'quota-cooldown', fallbackPayload);
      return res.json(fallbackPayload);
    }

    // Initialize Gemini and try model candidates in order until one succeeds.
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[ai-growth] Initiating Gemini call. candidates=${modelCandidates.join(',')} timeout=${AI_GENERATION_TIMEOUT_MS}ms tenant=${tenantId}`);

    const prompt = `
You are an expert AI Product Manager and SaaS Growth Consultant specializing in FinTech applications.
You are analyzing the exact telemetry of a specific client's application over the last ${days} days.

Here is the client's strictly isolated interaction data:
- Active Unique Users: ${metrics.activeUsers}
- Total Event Invocations: ${metrics.totalEvents}
- Most Used Feature: ${metrics.topFeature} (used ${metrics.topFeatureCount} times)

Critical Conversion Funnel (Chronological Steps):
1. Loan Apply Clicked: ${metrics.funnel.applyClicked} users
2. Document Upload Started: ${metrics.funnel.documentUpload} users
3. KYC Verification Started: ${metrics.funnel.kycStarted} users
4. Loan Approved (Converted): ${metrics.funnel.loanApproved} users

Perform a ruthless, objective analysis of these exact numbers. Calculate drop-off rates between stages.

Return a highly actionable growth report formatted EXACTLY as raw JSON (no markdown tags, no backticks).
You MUST follow this exact schema:
{
  "criticalIssues": ["A severe block or failure point", "Another serious issue"],
  "performanceSummary": "A comprehensive 2-3 sentence overview of their overall app and conversion health.",
  "funnelAnalysis": "A detailed evaluation of the Funnel Steps, pinpointing where users abandon the flow and why.",
  "anomalies": ["Any strange or unexpected data points, like a feature rarely used", "Drop-offs that defy logic"],
  "recommendations": [
    {
      "title": "Short title",
      "description": "Exactly how to fix the critical issue.",
      "impact": "High or Medium or Low"
    }
  ],
  "growthOpportunities": ["A blue-sky idea for how they could expand usage", "A new feature recommendation based on current data"]
}
`;

    const aiStartMs = Date.now();
    let selectedModelName = null;
    let attemptedModels = [];
    try {
      let aiResponse = null;
      let lastModelError = null;

      for (const candidateModel of modelCandidates) {
        attemptedModels.push(candidateModel);
        const candidateStartMs = Date.now();
        const candidate = genAI.getGenerativeModel({ model: candidateModel });

        try {
          console.log(`[ai-growth] Trying Gemini model=${candidateModel} tenant=${tenantId}`);
          aiResponse = await withTimeout(
            generateWithRetry(candidate, prompt),
            AI_GENERATION_TIMEOUT_MS
          );
          selectedModelName = candidateModel;
          break;
        } catch (candidateErr) {
          const candidateDurationMs = Date.now() - candidateStartMs;
          console.warn(`[ai-growth] Gemini model failed. model=${candidateModel} duration=${candidateDurationMs}ms reason=${candidateErr?.message || candidateErr}`);
          lastModelError = candidateErr;

          if (isModelUnavailableError(candidateErr)) {
            continue;
          }

          candidateErr.modelCandidate = candidateModel;
          throw candidateErr;
        }
      }

      if (!aiResponse) {
        const unsupportedModelsError = lastModelError || new Error('No Gemini model candidates are configured.');
        unsupportedModelsError.triedModels = attemptedModels;
        throw unsupportedModelsError;
      }

      const aiDurationMs = Date.now() - aiStartMs;
      let text = aiResponse.response.text().trim();

      // Safety check just in case Gemini wraps in markdown code blocks
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3).trim();
      }

      const report = JSON.parse(text);
      const payload = {
        data: report,
        rawMetrics: metrics,
        ai: { status: 'ok', provider: 'gemini', model: selectedModelName, fallback: false },
        _debug: {
          source: 'gemini-live',
          model: selectedModelName,
          triedModels: attemptedModels,
          durationMs: aiDurationMs,
          timeoutMs: AI_GENERATION_TIMEOUT_MS,
          cachedAt: null,
          generatedAt: new Date().toISOString(),
          apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'missing',
        }
      };
      setCachedAiGrowth(cacheKey, payload);
      logAiGrowthResponse(tenantId, 'gemini-success', payload, { durationMs: aiDurationMs });
      return res.json(payload);
    } catch (aiErr) {
      const aiDurationMs = Date.now() - aiStartMs;
      console.error(`[ai-growth] Gemini error after ${aiDurationMs}ms:`, aiErr?.message || aiErr);

      if (aiErr?.code === 'AI_TIMEOUT') {
        const resolvedModel = selectedModelName || aiErr?.modelCandidate || preferredModel;
        const fallbackPayload = {
          data: buildQuotaFallbackReport(metrics),
          rawMetrics: metrics,
          ai: {
            status: 'timeout-fallback',
            provider: 'gemini',
            model: resolvedModel,
            fallback: true,
            timeoutMs: AI_GENERATION_TIMEOUT_MS,
          },
          _debug: {
            source: 'timeout-fallback',
            model: resolvedModel,
            triedModels: attemptedModels,
            durationMs: aiDurationMs,
            timeoutMs: AI_GENERATION_TIMEOUT_MS,
            error: `AI timed out after ${aiDurationMs}ms`,
            generatedAt: new Date().toISOString(),
            apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'missing',
            hint: 'Increase AI_GENERATION_TIMEOUT_MS in .env or check Gemini API latency',
          }
        };
        setCachedAiGrowth(cacheKey, fallbackPayload, Math.min(15000, AI_REPORT_CACHE_TTL_MS));
        logAiGrowthResponse(tenantId, 'timeout-fallback', fallbackPayload, { durationMs: aiDurationMs });
        return res.json(fallbackPayload);
      }

      if (isQuotaExceededError(aiErr)) {
        const resolvedModel = selectedModelName || aiErr?.modelCandidate || preferredModel;
        const retryMs = parseRetryDelayMs(aiErr) || AI_QUOTA_COOLDOWN_MS;
        setQuotaCooldown(cacheKey, Math.max(retryMs, AI_QUOTA_COOLDOWN_MS));
        const fallbackPayload = {
          data: buildQuotaFallbackReport(metrics),
          rawMetrics: metrics,
          ai: {
            status: 'quota-exceeded',
            provider: 'gemini',
            model: resolvedModel,
            fallback: true,
            retryAfterMs: retryMs,
          },
          _debug: {
            source: 'quota-exceeded-fallback',
            model: resolvedModel,
            triedModels: attemptedModels,
            durationMs: aiDurationMs,
            timeoutMs: AI_GENERATION_TIMEOUT_MS,
            error: aiErr?.message,
            generatedAt: new Date().toISOString(),
            apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'missing',
            retryAfterMs: retryMs,
            hint: 'Quota exceeded. Wait for cooldown or upgrade Gemini tier.',
          }
        };
        setCachedAiGrowth(cacheKey, fallbackPayload, Math.min(Math.max(retryMs, 1000), AI_REPORT_CACHE_TTL_MS));
        logAiGrowthResponse(tenantId, 'quota-exceeded-fallback', fallbackPayload, { durationMs: aiDurationMs });
        return res.json(fallbackPayload);
      }
      throw aiErr;
    }

  } catch (err) {
    console.error('[ai-growth] Fatal error:', err?.message || err);

    const errMsg = (err?.message || '').toLowerCase();
    const errDetails = typeof err?.errorDetails === 'string' ? err.errorDetails.toLowerCase() : '';

    const leakedKey =
      err?.status === 403 &&
      (/reported as leaked/i.test(errMsg) || /reported as leaked/i.test(errDetails));

    if (leakedKey) {
      return res.status(503).json({
        error: 'Gemini API key was reported as leaked by Google. Set a fresh GEMINI_API_KEY in server/.env and restart the server.',
        needsConfiguration: true,
        _debug: {
          source: 'leaked-key-error',
          apiKeyPrefix: (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').slice(0, 8) + '...',
          hint: 'Generate a new Gemini API key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in server/.env',
        }
      });
    }

    const keyInvalid = err?.status === 400 && /api key not valid/i.test(errMsg);
    if (keyInvalid) {
      return res.status(503).json({
        error: 'Gemini API key is invalid. Check GEMINI_API_KEY in server/.env.',
        needsConfiguration: true,
        _debug: {
          source: 'invalid-key-error',
          hint: 'Generate a new Gemini API key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in server/.env',
        }
      });
    }

    if (isModelUnavailableError(err)) {
      const tried = Array.isArray(err?.triedModels) && err.triedModels.length
        ? err.triedModels.join(', ')
        : getGeminiModelCandidates().join(', ');

      return res.status(503).json({
        error: 'No configured Gemini model is currently available for generateContent.',
        needsConfiguration: true,
        _debug: {
          source: 'model-unavailable-error',
          errorMessage: err?.message,
          triedModels: tried,
          hint: 'Set GEMINI_MODEL or GEMINI_MODEL_CANDIDATES in server/.env to a supported model from Google AI Studio ListModels output.',
        }
      });
    }

    res.status(500).json({
      error: 'Failed to compute AI growth insights.',
      details: err.message,
      _debug: {
        source: 'fatal-error',
        errorType: err?.constructor?.name || 'Error',
        errorMessage: err?.message,
        hint: 'Check server logs for details',
      }
    });
  }
});

module.exports = router;
