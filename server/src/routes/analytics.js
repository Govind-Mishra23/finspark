const express = require('express');
const router = express.Router();
const { getEventModel } = require('../models/Event');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const Event = getEventModel(req.tenant._id.toString());
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
      return res.json({ 
        data: {
          criticalIssues: ["Insufficient Tracking Volume"],
          performanceSummary: "There is insufficient data to generate a meaningful predictive AI health check. Start simulating more traffic to unlock deeper insights.",
          funnelAnalysis: "No funnel activity detected to analyze.",
          anomalies: [],
          recommendations: [{ title: "Drive Traffic", description: "Use your live integration or the Loan Demo App more heavily to generate actionable interaction data.", impact: "High" }],
          growthOpportunities: ["Launch marketing campaigns to establish a baseline traction metric."]
        },
        rawMetrics: metrics
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const aiResponse = await model.generateContent(prompt);
    let text = aiResponse.response.text().trim();
    
    // Safety check just in case Gemini hallucinates markdown blocks
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const report = JSON.parse(text);
    res.json({ data: report, rawMetrics: metrics });

  } catch (err) {
    console.error("Gemini AI generation failed:", err);

    const leakedKey =
      err?.status === 403 &&
      (
        /reported as leaked/i.test(err?.message || '') ||
        /reported as leaked/i.test(err?.errorDetails || '')
      );

    if (leakedKey) {
      return res.status(503).json({
        error: 'Gemini API key was reported as leaked. Replace GEMINI_API_KEY or GOOGLE_API_KEY in the server environment and restart the server.',
        needsConfiguration: true,
      });
    }

    res.status(500).json({ error: 'Failed to compute AI growth insights.', details: err.message });
  }
});

module.exports = router;
