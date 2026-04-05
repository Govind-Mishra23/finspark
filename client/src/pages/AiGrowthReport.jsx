import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import {
  Sparkles, BrainCircuit, AlertOctagon,
  Filter, Activity, Lightbulb, Rocket, Download,
  Users, MousePointerClick, TrendingUp, Presentation,
  ChevronDown, ChevronUp, ArrowRight, Zap, CheckCircle2
} from 'lucide-react';

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
          {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Read more</>}
        </button>
      )}
    </span>
  );
}

// ── Stat KPI tile ─────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Pill list item ────────────────────────────────────────────────────────────
function PillItem({ color, text, limit }) {
  return (
    <li className={`flex gap-2 p-3 rounded-xl border text-sm items-start ${color}`}>
      <span className="mt-0.5 shrink-0">•</span>
      <ReadMoreText text={text} limit={limit || 100} />
    </li>
  );
}

// ── Impact badge ──────────────────────────────────────────────────────────────
const impactStyle = {
  High: 'bg-indigo-100 text-indigo-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function AiGrowthReport() {
  const [report, setReport] = useState(null);
  const [rawMetrics, setRawMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/ai-growth');
      setReport(res.data.data);
      setRawMetrics(res.data.rawMetrics);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to communicate with DeepInsight AI.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report || !rawMetrics) return;
    const convRate = rawMetrics.funnel.applyClicked > 0
      ? Math.round((rawMetrics.funnel.loanApproved / rawMetrics.funnel.applyClicked) * 100)
      : 0;

    let content = `DeepInsight AI — Executive Growth Report\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
    content += `KPIs\nActive Users: ${rawMetrics.activeUsers}\nTotal Actions: ${rawMetrics.totalEvents}\nConv. Rate: ${convRate}%\nTop Feature: ${rawMetrics.topFeature.replace(/_/g, ' ')}\n\n`;
    content += `PERFORMANCE SUMMARY\n${report.performanceSummary}\n\n`;
    content += `RECOMMENDATIONS\n`;
    report.recommendations?.forEach((r, i) => { content += `${i + 1}. [${r.impact}] ${r.title}\n   ${r.description}\n\n`; });
    content += `CRITICAL ISSUES\n`;
    report.criticalIssues?.forEach(i => { content += `- ${i}\n`; });
    content += `\nFUNNEL ANALYSIS\n${report.funnelAnalysis}\n\n`;
    content += `ANOMALIES\n`;
    report.anomalies?.forEach(a => { content += `- ${a}\n`; });
    content += `\nGROWTH VECTORS\n`;
    report.growthOpportunities?.forEach(g => { content += `- ${g}\n`; });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepInsight_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Pre-load state ──────────────────────────────────────────────────────────
  if (!report && !loading) return (
    <div>
      <PageHeader
        title="DeepInsight AI"
        subtitle="Powered by Gemini 2.5 Flash — cognitive analysis of your tracking data."
      />
      <div className="flex flex-col items-center justify-center p-12 mt-6 bg-gradient-to-br from-white to-indigo-50/40 rounded-2xl border border-indigo-100 text-center shadow-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center mb-5">
          <BrainCircuit size={34} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Run Deep Diagnostics</h2>
        <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
          Gemini will scan your telemetry and compile a 6-vector analysis: Critical Issues, Funnel Drop-offs, Anomalies, Recommendations, and Growth Vectors.
        </p>
        <button
          onClick={generateReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 text-sm"
        >
          <Sparkles size={16} className="text-indigo-400" />
          Generate Analysis
        </button>
        {error && <p className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 text-xs">{error}</p>}
      </div>
    </div>
  );

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) return (
    <div>
      <PageHeader title="DeepInsight AI" subtitle="Powered by Gemini 2.5 Flash." />
      <div className="flex flex-col items-center justify-center p-20 mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit size={24} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-800">Compiling analysis…</h3>
        <p className="text-gray-400 text-xs mt-1">Parsing funnel metrics and growth vectors</p>
      </div>
    </div>
  );

  // ── Computed values ─────────────────────────────────────────────────────────
  const convRate = rawMetrics.funnel.applyClicked > 0
    ? Math.round((rawMetrics.funnel.loanApproved / rawMetrics.funnel.applyClicked) * 100)
    : 0;

  // ── Report view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <PageHeader
        title="DeepInsight AI"
        subtitle="Powered by Gemini 2.5 Flash — cognitive analysis of your tracking data."
      />

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Analysis complete
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-200 transition-colors"
          >
            <Download size={13} /> Export Brief
          </button>
          <button
            onClick={generateReport}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
          >
            Recalculate
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Users}            iconColor="bg-blue-500"   label="Active Users"   value={rawMetrics.activeUsers} />
        <StatTile icon={MousePointerClick} iconColor="bg-purple-500" label="Total Actions"  value={rawMetrics.totalEvents} />
        <StatTile icon={TrendingUp}        iconColor="bg-emerald-500" label="Conv. Rate"    value={`${convRate}%`} sub="Apply → Approved" />
        <StatTile icon={Presentation}      iconColor="bg-orange-500" label="Top Feature"   value={rawMetrics.topFeature.replace(/_/g, ' ')} />
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
                <Zap size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Performance Readout</span>
              </div>
              <ReadMoreText text={report.performanceSummary || 'No summary provided.'} limit={200} />
            </div>
          </div>

          {/* Issues + Anomalies row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Critical Issues */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-50 bg-red-50/60">
                <AlertOctagon size={15} className="text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">Critical Issues</span>
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                  {report.criticalIssues?.length || 0}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {(!report.criticalIssues || report.criticalIssues.length === 0)
                  ? <li className="text-gray-400 text-xs italic p-1">No critical issues detected.</li>
                  : report.criticalIssues.map((issue, i) => (
                    <PillItem key={i} text={issue} color="bg-red-50 border-red-100 text-red-700" limit={90} />
                  ))
                }
              </ul>
            </div>

            {/* Anomalies */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-50 bg-orange-50/60">
                <Activity size={15} className="text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Anomalies</span>
                <span className="ml-auto text-xs bg-orange-400 text-white rounded-full px-2 py-0.5 font-bold">
                  {report.anomalies?.length || 0}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {(!report.anomalies || report.anomalies.length === 0)
                  ? <li className="text-gray-400 text-xs italic p-1">Patterns appear normal.</li>
                  : report.anomalies.map((a, i) => (
                    <PillItem key={i} text={a} color="bg-orange-50 border-orange-100 text-orange-700" limit={90} />
                  ))
                }
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <Lightbulb size={15} className="text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Tactical Recommendations</span>
              <span className="ml-auto text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5 font-bold">
                {report.recommendations?.length || 0}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {(!report.recommendations || report.recommendations.length === 0)
                ? <div className="p-5 text-gray-400 text-xs text-center">Awaiting more data.</div>
                : report.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowRight size={12} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{rec.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${impactStyle[rec.impact] || impactStyle.Low}`}>
                          {rec.impact}
                        </span>
                      </div>
                      <ReadMoreText text={rec.description} limit={100} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

        </div>{/* /Left */}

        {/* Right — 1/3 */}
        <div className="space-y-5">

          {/* Funnel Diagnosis */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <Filter size={15} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Funnel Diagnosis</span>
            </div>
            <div className="p-4">
              <div className="flex gap-3 items-start bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                <div className="w-1 self-stretch bg-indigo-400 rounded-full shrink-0" />
                <ReadMoreText text={report.funnelAnalysis || 'No funnel breakdown generated.'} limit={150} />
              </div>
              {/* Mini funnel stat bars */}
              {rawMetrics.funnel && (
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Apply Clicked', val: rawMetrics.funnel.applyClicked, color: 'bg-blue-400' },
                    { label: 'Loan Approved', val: rawMetrics.funnel.loanApproved, color: 'bg-emerald-400' },
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
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
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
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Growth Vectors</span>
              <span className="ml-auto text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5 font-bold">
                {report.growthOpportunities?.length || 0}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {(!report.growthOpportunities || report.growthOpportunities.length === 0)
                ? <p className="text-gray-400 text-xs italic p-1">Increase tracking volume to unlock.</p>
                : report.growthOpportunities.map((g, i) => (
                  <div key={i} className="flex gap-2 bg-white border border-indigo-100 rounded-xl p-3 items-start shadow-sm">
                    <CheckCircle2 size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <ReadMoreText text={g} limit={90} />
                  </div>
                ))
              }
            </div>
          </div>

        </div>{/* /Right */}
      </div>
    </div>
  );
}
