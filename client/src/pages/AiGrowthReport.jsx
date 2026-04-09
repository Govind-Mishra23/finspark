import { useState } from "react";
import PageHeader from "../components/PageHeader";
import api from "../lib/api";
import { useTenant } from "../context/TenantContext";
import {
  Sparkles,
  BrainCircuit,
  AlertOctagon,
  Filter,
  Activity,
  Lightbulb,
  Rocket,
  Download,
  Users,
  MousePointerClick,
  TrendingUp,
  Presentation,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  CheckCircle2,
  Bug,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Key,
  WifiOff,
} from "lucide-react";

// ── Reusable "Read More" wrapper ──────────────────────────────────────────────
function ReadMoreText({ text, limit = 120 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-gray-400 italic text-xs">N/A</span>;
  const short = text.length <= limit;
  return (
    <span>
      <span className="text-gray-600 text-sm leading-relaxed">
        {expanded || short ? text : `${text.slice(0, limit)}…`}
      </span>
      {!short && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1.5 inline-flex items-center gap-0.5 text-indigo-600 text-xs font-bold hover:underline focus:outline-none"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} /> Less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Read more
            </>
          )}
        </button>
      )}
    </span>
  );
}

// ── Stat KPI tile ─────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Pill list item ────────────────────────────────────────────────────────────
function PillItem({ color, text, limit }) {
  return (
    <li
      className={`flex gap-2 p-3 rounded-xl border text-sm items-start ${color}`}
    >
      <span className="mt-0.5 shrink-0">•</span>
      <ReadMoreText text={text} limit={limit || 100} />
    </li>
  );
}

// ── Impact badge ──────────────────────────────────────────────────────────────
const impactStyle = {
  High: "bg-indigo-100 text-indigo-700",
  Medium: "bg-blue-100 text-blue-700",
  Low: "bg-gray-100 text-gray-600",
};

// ── Debug Console Panel ───────────────────────────────────────────────────────
function DebugConsole({ debugData, aiMeta, rawMetrics, onClose }) {
  const source = debugData?.source || aiMeta?.status || "unknown";
  const isLive = source === "gemini-live" && !aiMeta?.fallback;
  const isFallback = aiMeta?.fallback === true;
  const isTimeout = source === "timeout-fallback";
  const isQuota =
    source === "quota-exceeded-fallback" || aiMeta?.status === "quota-exceeded";

  const statusColor = isLive
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : isTimeout
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : isQuota
        ? "text-orange-600 bg-orange-50 border-orange-200"
        : "text-gray-600 bg-gray-50 border-gray-200";

  const statusIcon = isLive ? (
    <CheckCircle size={14} className="text-emerald-500" />
  ) : isTimeout ? (
    <Clock size={14} className="text-amber-500" />
  ) : isQuota ? (
    <WifiOff size={14} className="text-orange-500" />
  ) : (
    <AlertTriangle size={14} className="text-gray-500" />
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-gray-950 text-gray-100 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-indigo-400" />
          <span className="font-bold text-indigo-300 tracking-wider uppercase text-[10px]">
            AI Debug Console
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Status */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${statusColor}`}
        >
          {statusIcon}
          {isLive
            ? "✅ LIVE AI Response"
            : isFallback
              ? `⚠️ FALLBACK (${source})`
              : source}
        </div>
        {isFallback && (
          <p className="mt-2 text-amber-400 text-[10px] leading-relaxed">
            ⚠️ This report was generated from deterministic rules, NOT from the
            real Model.
            {debugData?.hint && ` Hint: ${debugData.hint}`}
          </p>
        )}
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-1.5">
        <DebugRow
          icon={<Cpu size={11} />}
          label="Model"
          value={debugData?.model ? "Configured (hidden)" : "unknown"}
        />
        <DebugRow
          icon={<Key size={11} />}
          label="API Key Prefix"
          value={debugData?.apiKeyPrefix || "hidden"}
        />
        <DebugRow
          icon={<Clock size={11} />}
          label="Duration"
          value={
            debugData?.durationMs != null ? `${debugData.durationMs}ms` : "—"
          }
          highlight={debugData?.durationMs > 30000}
        />
        <DebugRow
          icon={<Clock size={11} />}
          label="Timeout Cap"
          value={
            debugData?.timeoutMs != null ? `${debugData.timeoutMs}ms` : "—"
          }
        />
        <DebugRow label="Generated At" value={debugData?.generatedAt || "—"} />
        {debugData?.error && (
          <DebugRow label="Error" value={debugData.error} isError />
        )}
        {debugData?.retryAfterMs && (
          <DebugRow
            label="Retry After"
            value={`${Math.round(debugData.retryAfterMs / 1000)}s`}
          />
        )}
        {rawMetrics && (
          <>
            <div className="border-t border-gray-800 pt-1.5 mt-1.5">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider">
                Raw Metrics
              </span>
            </div>
            <DebugRow label="Active Users" value={rawMetrics.activeUsers} />
            <DebugRow label="Total Events" value={rawMetrics.totalEvents} />
            <DebugRow
              label="Top Feature"
              value={rawMetrics.topFeature?.replace(/_/g, " ") || "—"}
            />
            <DebugRow
              label="Apply Clicked"
              value={rawMetrics.funnel?.applyClicked ?? "—"}
            />
            <DebugRow
              label="Loan Approved"
              value={rawMetrics.funnel?.loanApproved ?? "—"}
            />
          </>
        )}
      </div>

      {/* Footer tip */}
      <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-gray-500 text-[10px]">
        Server:{" "}
        <code className="text-indigo-400">GET /api/analytics/ai-growth</code> ·
        Check server logs for full trace
      </div>
    </div>
  );
}

function DebugRow({ icon, label, value, isError, highlight }) {
  return (
    <div className="flex items-start gap-1.5">
      {icon && <span className="text-gray-500 mt-0.5 shrink-0">{icon}</span>}
      <span className="text-gray-500 shrink-0 w-28">{label}:</span>
      <span
        className={`break-all ${
          isError
            ? "text-red-400"
            : highlight
              ? "text-amber-400"
              : "text-gray-200"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AiGrowthReport() {
  const { auth, currentTenant } = useTenant();
  const [report, setReport] = useState(null);
  const [rawMetrics, setRawMetrics] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const tenantApiKey = auth?.apiKey || currentTenant?.apiKey || null;

  const generateReport = async () => {
    if (loading) return;

    if (!tenantApiKey) {
      setError("Please sign in before generating an AI growth report.");
      return;
    }

    setLoading(true);
    setError(null);
    setShowDebug(false);
    try {
      // 60s timeout — gives server enough time for provider response + its own 45s timeout
      const res = await api.get("/analytics/ai-growth", {
        timeout: 60000,
        headers: {
          "x-api-key": tenantApiKey,
          ...(auth?.role === "admin" ? { "x-admin-key": tenantApiKey } : {}),
        },
      });
      setReport(res.data.data);
      setRawMetrics(res.data.rawMetrics);
      setAiMeta(res.data.ai || null);
      setDebugData(res.data._debug || null);

      // Auto-open debug if it's a fallback response
      if (res.data.ai?.fallback) {
        setShowDebug(true);
      }
    } catch (err) {
      // Attach debug info from error response if available
      if (err.response?.data?._debug) {
        setDebugData(err.response.data._debug);
        setShowDebug(true);
      }

      if (
        err.response?.status === 503 &&
        err.response?.data?.needsConfiguration
      ) {
        const msg =
          err.response?.data?.error ||
          "AI provider is not configured correctly.";
        const hint = err.response?.data?._debug?.hint || "";
        setError(`${msg}${hint ? ` → ${hint}` : ""}`);
      } else if (
        err.response?.status === 403 &&
        /leaked/i.test(err.response?.data?.error || "")
      ) {
        setError(
          err.response?.data?.error ||
            "AI provider rejected the configured API key (reported as leaked). Replace GEMINI_API_KEY in server/.env and restart.",
        );
      } else if (err.response?.status === 403) {
        setError(
          err.response?.data?.error ||
            "This tenant key is not allowed to access analytics from the current origin.",
        );
      } else if (err.response?.status === 401) {
        setError(
          err.response?.data?.error ||
            "Missing tenant authorization. Please sign in again.",
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "Request timed out after 60s. The AI provider may be slow — please try again. If this persists, check network connectivity.",
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to communicate with DeepInsight AI.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report || !rawMetrics) return;
    const convRate =
      rawMetrics.funnel.applyClicked > 0
        ? Math.round(
            (rawMetrics.funnel.loanApproved / rawMetrics.funnel.applyClicked) *
              100,
          )
        : 0;

    let content = `DeepInsight AI — Executive Growth Report\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    content += `KPIs\nActive Users: ${rawMetrics.activeUsers}\nTotal Actions: ${rawMetrics.totalEvents}\nConv. Rate: ${convRate}%\nTop Feature: ${rawMetrics.topFeature.replace(/_/g, " ")}\n\n`;
    content += `PERFORMANCE SUMMARY\n${report.performanceSummary}\n\n`;
    content += `RECOMMENDATIONS\n`;
    report.recommendations?.forEach((r, i) => {
      content += `${i + 1}. [${r.impact}] ${r.title}\n   ${r.description}\n\n`;
    });
    content += `CRITICAL ISSUES\n`;
    report.criticalIssues?.forEach((i) => {
      content += `- ${i}\n`;
    });
    content += `\nFUNNEL ANALYSIS\n${report.funnelAnalysis}\n\n`;
    content += `ANOMALIES\n`;
    report.anomalies?.forEach((a) => {
      content += `- ${a}\n`;
    });
    content += `\nGROWTH VECTORS\n`;
    report.growthOpportunities?.forEach((g) => {
      content += `- ${g}\n`;
    });

    if (aiMeta) {
      content += `\n--- AI Metadata ---\nModel: hidden\nSource: ${aiMeta.status}\nFallback: ${aiMeta.fallback ? "Yes (deterministic)" : "No (live AI)"}\n`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DeepInsight_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Pre-load state ──────────────────────────────────────────────────────────
  if (!report && !loading)
    return (
      <div>
        <PageHeader
          title="DeepInsight AI"
          subtitle="Powered by an advanced AI model — cognitive analysis of your tracking data."
        />
        <div className="flex flex-col items-center justify-center p-12 mt-6 bg-gradient-to-br from-white to-indigo-50/40 rounded-2xl border border-indigo-100 text-center shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center mb-5">
            <BrainCircuit size={34} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Run Deep Diagnostics
          </h2>
          <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
            AI will scan your telemetry and compile a 6-vector analysis:
            Critical Issues, Funnel Drop-offs, Anomalies, Recommendations, and
            Growth Vectors.
          </p>
          <button
            onClick={generateReport}
            disabled={loading}
            id="generate-ai-report-btn"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 text-sm"
          >
            <Sparkles size={16} className="text-indigo-400" />
            Generate Analysis
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs text-left w-full max-w-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5 text-red-500"
                />
                <div>
                  <p className="font-bold mb-1">Error generating AI report</p>
                  <p className="leading-relaxed">{error}</p>
                  {debugData?.hint && (
                    <p className="mt-2 text-red-500 font-medium">
                      💡 {debugData.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug toggle even before report is loaded */}
        {debugData && (
          <button
            onClick={() => setShowDebug((s) => !s)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-gray-950 text-indigo-300 rounded-xl text-xs font-bold shadow-lg border border-gray-800 hover:bg-gray-900 transition-colors"
          >
            <Bug size={13} /> Debug
          </button>
        )}
        {showDebug && debugData && (
          <DebugConsole
            debugData={debugData}
            aiMeta={null}
            rawMetrics={null}
            onClose={() => setShowDebug(false)}
          />
        )}
      </div>
    );

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading)
    return (
      <div>
        <PageHeader
          title="DeepInsight AI"
          subtitle="Powered by an advanced AI model."
        />
        <div className="flex flex-col items-center justify-center p-20 mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit
                size={24}
                className="text-indigo-600 animate-pulse"
              />
            </div>
          </div>
          <h3 className="text-base font-bold text-gray-800">
            Compiling analysis…
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Querying AI engine · this can take up to 45 seconds
          </p>
        </div>
      </div>
    );

  // ── Computed values ─────────────────────────────────────────────────────────
  const convRate =
    rawMetrics.funnel.applyClicked > 0
      ? Math.round(
          (rawMetrics.funnel.loanApproved / rawMetrics.funnel.applyClicked) *
            100,
        )
      : 0;

  const isFallback = aiMeta?.fallback === true;
  const isLiveAI = !isFallback && aiMeta?.status === "ok";

  // ── Report view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <PageHeader
        title="DeepInsight AI"
        subtitle="Powered by an advanced AI model — cognitive analysis of your tracking data."
      />

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveAI ? "bg-emerald-400" : "bg-amber-400"}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${isLiveAI ? "bg-emerald-500" : "bg-amber-500"}`}
              />
            </span>
            {isLiveAI ? "Live AI Analysis" : "Fallback Report (Deterministic)"}
          </div>

          {/* AI source badge */}
          {aiMeta && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                isLiveAI
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isLiveAI ? (
                <CheckCircle size={10} />
              ) : (
                <AlertTriangle size={10} />
              )}
              {isLiveAI ? "AI Model Active" : `Fallback · ${aiMeta.status}`}
            </span>
          )}

          {isFallback && (
            <span className="text-[10px] text-amber-600 italic">
              ⚠️ Not a real AI response — shows rule-based metrics
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug((s) => !s)}
            id="debug-console-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              showDebug
                ? "bg-indigo-600 text-white border-indigo-700"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            }`}
          >
            <Bug size={12} />
            Debug
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-200 transition-colors"
          >
            <Download size={13} /> Export Brief
          </button>
          <button
            onClick={generateReport}
            disabled={loading}
            id="recalculate-report-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw size={12} />
            Recalculate
          </button>
        </div>
      </div>

      {/* Fallback warning banner */}
      {isFallback && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-800 mb-0.5">
              Showing Fallback Report
            </p>
            <p className="text-amber-700 text-xs leading-relaxed">
              {aiMeta?.status === "timeout-fallback"
                ? `The AI provider took longer than ${(debugData?.timeoutMs || 45000) / 1000}s to respond. The data below is computed from deterministic rules, not real AI. Try recalculating — response time may improve next time.`
                : aiMeta?.status === "quota-exceeded"
                  ? `AI provider quota was exceeded. Retry available in ${Math.round((debugData?.retryAfterMs || 60000) / 1000)}s. The data below is computed from deterministic rules.`
                  : `The real AI response was unavailable (${aiMeta?.status}). The data below is computed from deterministic rules.`}{" "}
              Click <strong>Debug</strong> for technical details.
            </p>
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Users}
          iconColor="bg-blue-500"
          label="Active Users"
          value={rawMetrics.activeUsers}
        />
        <StatTile
          icon={MousePointerClick}
          iconColor="bg-purple-500"
          label="Total Actions"
          value={rawMetrics.totalEvents}
        />
        <StatTile
          icon={TrendingUp}
          iconColor="bg-emerald-500"
          label="Conv. Rate"
          value={`${convRate}%`}
          sub="Apply → Approved"
        />
        <StatTile
          icon={Presentation}
          iconColor="bg-orange-500"
          label="Top Feature"
          value={rawMetrics.topFeature.replace(/_/g, " ")}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Readout */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap
                  size={14}
                  className={isLiveAI ? "text-indigo-400" : "text-amber-400"}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${isLiveAI ? "text-indigo-400" : "text-amber-400"}`}
                >
                  {isLiveAI
                    ? "AI Performance Readout — Live AI"
                    : "AI Performance Readout — Deterministic Fallback"}
                </span>
              </div>
              <ReadMoreText
                text={report.performanceSummary || "No summary provided."}
                limit={200}
              />
            </div>
          </div>

          {/* Issues + Anomalies row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Critical Issues */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-50 bg-red-50/60">
                <AlertOctagon size={15} className="text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Critical Issues
                </span>
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                  {report.criticalIssues?.length || 0}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {!report.criticalIssues ||
                report.criticalIssues.length === 0 ? (
                  <li className="text-gray-400 text-xs italic p-1">
                    No critical issues detected.
                  </li>
                ) : (
                  report.criticalIssues.map((issue, i) => (
                    <PillItem
                      key={i}
                      text={issue}
                      color="bg-red-50 border-red-100 text-red-700"
                      limit={90}
                    />
                  ))
                )}
              </ul>
            </div>

            {/* Anomalies */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-50 bg-orange-50/60">
                <Activity size={15} className="text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                  Anomalies
                </span>
                <span className="ml-auto text-xs bg-orange-400 text-white rounded-full px-2 py-0.5 font-bold">
                  {report.anomalies?.length || 0}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {!report.anomalies || report.anomalies.length === 0 ? (
                  <li className="text-gray-400 text-xs italic p-1">
                    Patterns appear normal.
                  </li>
                ) : (
                  report.anomalies.map((a, i) => (
                    <PillItem
                      key={i}
                      text={a}
                      color="bg-orange-50 border-orange-100 text-orange-700"
                      limit={90}
                    />
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <Lightbulb size={15} className="text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Tactical Recommendations
              </span>
              <span className="ml-auto text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5 font-bold">
                {report.recommendations?.length || 0}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {!report.recommendations ||
              report.recommendations.length === 0 ? (
                <div className="p-5 text-gray-400 text-xs text-center">
                  Awaiting more data.
                </div>
              ) : (
                report.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight size={12} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">
                          {rec.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${impactStyle[rec.impact] || impactStyle.Low}`}
                        >
                          {rec.impact}
                        </span>
                      </div>
                      <ReadMoreText text={rec.description} limit={100} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* /Left */}

        {/* Right — 1/3 */}
        <div className="space-y-5">
          {/* Funnel Diagnosis */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <Filter size={15} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Funnel Diagnosis
              </span>
            </div>
            <div className="p-4">
              <div className="flex gap-3 items-start bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                <div className="w-1 self-stretch bg-indigo-400 rounded-full shrink-0" />
                <ReadMoreText
                  text={
                    report.funnelAnalysis || "No funnel breakdown generated."
                  }
                  limit={150}
                />
              </div>
              {/* Mini funnel stat bars */}
              {rawMetrics.funnel && (
                <div className="mt-4 space-y-2">
                  {[
                    {
                      label: "Apply Clicked",
                      val: rawMetrics.funnel.applyClicked,
                      color: "bg-blue-400",
                    },
                    {
                      label: "Loan Approved",
                      val: rawMetrics.funnel.loanApproved,
                      color: "bg-emerald-400",
                    },
                  ].map(({ label, val, color }) => {
                    const max = rawMetrics.funnel.applyClicked || 1;
                    const pct = Math.min(100, Math.round((val / max) * 100));
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                          <span>{label}</span>
                          <span className="font-bold text-gray-700">{val}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Growth Vectors */}
          <div className="bg-gradient-to-b from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-100">
              <Rocket size={15} className="text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Growth Vectors
              </span>
              <span className="ml-auto text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5 font-bold">
                {report.growthOpportunities?.length || 0}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {!report.growthOpportunities ||
              report.growthOpportunities.length === 0 ? (
                <p className="text-gray-400 text-xs italic p-1">
                  Increase tracking volume to unlock.
                </p>
              ) : (
                report.growthOpportunities.map((g, i) => (
                  <div
                    key={i}
                    className="flex gap-2 bg-white border border-indigo-100 rounded-xl p-3 items-start shadow-sm"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <ReadMoreText text={g} limit={90} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* /Right */}
      </div>

      {/* Floating debug console */}
      {showDebug && debugData && (
        <DebugConsole
          debugData={debugData}
          aiMeta={aiMeta}
          rawMetrics={rawMetrics}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}
