import { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldCheck, Server, Cloud, Eye, EyeOff, UserCheck, ToggleLeft, ToggleRight, Check, AlertTriangle, Lock } from 'lucide-react';

const API_BASE = 'http://localhost:5050';

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
        value ? 'bg-indigo-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function StatusBadge({ label, color }) {
  const colors = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {label}
    </span>
  );
}

export default function Governance() {
  const { currentTenant } = useTenant();
  const [config, setConfig] = useState({
    piiMasking: false,
    requireConsent: false,
    trackingConsent: true,
    deploymentModel: 'cloud',
  });
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // 'success' | 'error' | null
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (currentTenant?.config) {
      setConfig({
        piiMasking: currentTenant.config.piiMasking ?? false,
        requireConsent: currentTenant.config.requireConsent ?? false,
        trackingConsent: currentTenant.config.trackingConsent ?? true,
        deploymentModel: currentTenant.config.deploymentModel ?? 'cloud',
      });
    }
    setInitialLoad(false);
  }, [currentTenant]);

  async function handleSave() {
    if (!currentTenant?.apiKey) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenants/governance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentTenant.apiKey,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Server error');
      setSaveResult('success');
    } catch {
      setSaveResult('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 3500);
    }
  }

  if (initialLoad) return <div className="text-slate-400 animate-pulse p-12">Loading governance settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="text-indigo-400" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-white">Governance & Compliance</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Configure privacy controls, deployment topology, and regulatory compliance settings for your InsightX tenant instance.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Lock size={16} /> Save Configuration</>
          )}
        </button>
      </div>

      {/* Status Alert */}
      {saveResult === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <Check size={18} /> Governance settings saved and applied successfully.
        </div>
      )}
      {saveResult === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle size={18} /> Failed to save. Check your API key and try again.
        </div>
      )}

      {/* Deployment Model Selector */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Server size={18} className="text-cyan-400" /> Deployment Architecture
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Define whether your enterprise deployment runs in a shared Cloud environment or a network-restricted On-Premise topology. This determines how the InsightX SDK transmits telemetry data.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cloud */}
          <button
            onClick={() => setConfig(c => ({ ...c, deploymentModel: 'cloud' }))}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              config.deploymentModel === 'cloud'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
            }`}
          >
            {config.deploymentModel === 'cloud' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            <Cloud className={`mb-3 ${config.deploymentModel === 'cloud' ? 'text-indigo-400' : 'text-slate-500'}`} size={28} />
            <div className="font-bold text-white mb-1">Cloud Deployment</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              Real-time event streaming. Raw telemetry is transmitted instantly to the InsightX cloud ingestion pipeline for live dashboard updates.
            </div>
            <div className="mt-3"><StatusBadge label="Real-time Stream" color="indigo" /></div>
          </button>

          {/* On-Premise */}
          <button
            onClick={() => setConfig(c => ({ ...c, deploymentModel: 'on-premise' }))}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              config.deploymentModel === 'on-premise'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
            }`}
          >
            {config.deploymentModel === 'on-premise' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            <Server className={`mb-3 ${config.deploymentModel === 'on-premise' ? 'text-amber-400' : 'text-slate-500'}`} size={28} />
            <div className="font-bold text-white mb-1">On-Premise Federation</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              Network-egress restricted. SDK batches events locally in memory and transmits only anonymized aggregate counts every 30 seconds to protect internal data.
            </div>
            <div className="mt-3"><StatusBadge label="Federated Batch Sync" color="amber" /></div>
          </button>
        </div>

        {config.deploymentModel === 'on-premise' && (
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>On-Prem mode active:</strong> The SDK will buffer all events in the browser's <code>sessionStorage</code> and only transmit anonymized numeric aggregates (e.g., "Loan_Approved clicked 14 times") to the cloud. No raw user journeys or PII leave the on-prem environment.
            </span>
          </div>
        )}
      </div>

      {/* Privacy Controls */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Eye size={18} className="text-violet-400" /> Privacy & PII Controls
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Enforce data privacy policies at the ingestion layer. These settings are applied server-side before any event data is written to your isolated tenant collection.
        </p>
        <div className="space-y-5">
          {/* PII Masking */}
          <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <EyeOff size={16} className="text-violet-400" />
                <span className="text-white font-semibold text-sm">PII Scrubbing</span>
                <StatusBadge label={config.piiMasking ? 'Active' : 'Disabled'} color={config.piiMasking ? 'green' : 'red'} />
              </div>
              <p className="text-slate-400 text-xs">
                When enabled, the cloud ingestion pipeline automatically redacts fields containing emails, phone numbers, passwords, and names before writing to MongoDB. Fully GDPR-compliant.
              </p>
            </div>
            <div className="ml-6 shrink-0">
              <Toggle value={config.piiMasking} onChange={v => setConfig(c => ({ ...c, piiMasking: v }))} />
            </div>
          </div>

          {/* Require Consent */}
          <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck size={16} className="text-cyan-400" />
                <span className="text-white font-semibold text-sm">Require End-User Consent</span>
                <StatusBadge label={config.requireConsent ? 'Enforced' : 'Optional'} color={config.requireConsent ? 'green' : 'amber'} />
              </div>
              <p className="text-slate-400 text-xs">
                When enabled, the SDK will not fire any events until your application explicitly calls <code className="text-cyan-300">InsightX.grantConsent()</code>. Mandatory for CCPA and GDPR compliance in regulated industries.
              </p>
            </div>
            <div className="ml-6 shrink-0">
              <Toggle value={config.requireConsent} onChange={v => setConfig(c => ({ ...c, requireConsent: v }))} />
            </div>
          </div>

          {/* Tracking Consent */}
          <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ToggleRight size={16} className="text-emerald-400" />
                <span className="text-white font-semibold text-sm">Global Tracking Active</span>
                <StatusBadge label={config.trackingConsent ? 'Enabled' : 'Paused'} color={config.trackingConsent ? 'green' : 'red'} />
              </div>
              <p className="text-slate-400 text-xs">
                Master kill-switch for all InsightX telemetry collection for this tenant. Disable to completely pause data ingestion without removing the SDK from client applications.
              </p>
            </div>
            <div className="ml-6 shrink-0">
              <Toggle value={config.trackingConsent} onChange={v => setConfig(c => ({ ...c, trackingConsent: v }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Reference */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" /> Regulatory Reference
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'GDPR', status: config.piiMasking && config.requireConsent, desc: 'EU General Data Protection Regulation' },
            { label: 'CCPA', status: config.requireConsent, desc: 'California Consumer Privacy Act' },
            { label: 'ISO 27001', status: config.piiMasking, desc: 'Information security management' },
          ].map(reg => (
            <div key={reg.label} className={`p-4 rounded-xl border ${reg.status ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/40'}`}>
              <div className="flex items-center gap-2 mb-1">
                {reg.status ? <Check size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
                <span className="font-bold text-white text-sm">{reg.label}</span>
              </div>
              <p className="text-xs text-slate-400">{reg.desc}</p>
              <p className="text-xs mt-2 font-semibold">
                {reg.status ? <span className="text-emerald-400">Compliant</span> : <span className="text-amber-400">Needs configuration</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
