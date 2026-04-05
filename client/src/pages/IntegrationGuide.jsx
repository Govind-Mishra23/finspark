import { useState, useEffect } from 'react';
import { Code, Copy, Check, Terminal, Globe, Smartphone } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import PageHeader from '../components/PageHeader';

export default function IntegrationGuide() {
  const { auth } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get('/tenants', {
      headers: { 'x-admin-key': auth?.apiKey },
    }).then(res => {
      setTenants(res.data.tenants || []);
      if (res.data.tenants?.length > 0) setSelectedTenant(res.data.tenants[0]);
    }).catch(console.error);
  }, [auth]);

  const backendUrl = window.location.origin.replace(':3000', ':5050');
  const apiKey = selectedTenant?.apiKey || 'YOUR_API_KEY';
  const tenantName = selectedTenant?.name || 'your_app';

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ code, id }) => (
    <button
      onClick={() => copyCode(code, id)}
      className={`absolute top-3 right-3 border-none rounded-md px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${copied === id ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
    >
      {copied === id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );

  const CodeBlock = ({ code, id }) => (
    <div className="relative">
      <CopyButton code={code} id={id} />
      <pre className="bg-[#0d1117] border border-gray-200/10 rounded-xl p-5 text-[12.5px] text-[#e6edf3] overflow-auto leading-relaxed font-mono">
        {code}
      </pre>
    </div>
  );

  const htmlSnippet = `<!-- Add to your HTML -->
<script src="${backendUrl}/sdk/insightx.js"><\/script>
<script>
  // Initialize InsightX SDK
  InsightX.init({
    apiKey: "${apiKey}",
    endpoint: "${backendUrl}",
    tenantId: "${tenantName}"
  });
<\/script>`;

  const trackSnippet = `// Track feature usage anywhere in your app
InsightX.trackEvent("Feature_Name", {
  userId: currentUser.id,
  page: window.location.pathname,
  action: "clicked"
});

// Examples:
InsightX.trackEvent("Checkout_Started", { userId: "u_123" });
InsightX.trackEvent("Search_Used", { userId: "u_123", query: "shoes" });
InsightX.trackEvent("Profile_Updated", { userId: "u_456" });`;

  const reactSnippet = `// In your React app (npm install)
// Copy insightx-sdk.js to your project

import InsightX from './insightx-sdk';

// Initialize once in App.jsx
useEffect(() => {
  InsightX.init({
    apiKey: "${apiKey}",
    endpoint: "${backendUrl}",
    tenantId: "${tenantName}"
  });
  return () => InsightX.destroy();
}, []);

// Track in any component
const handleClick = () => {
  InsightX.trackEvent("Button_Clicked", {
    userId: user.id,
    component: "NavBar"
  });
};`;

  const apiSnippet = `# Direct REST API (no SDK needed)
curl -X POST ${backendUrl}/api/events \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "eventName": "Page_Visited",
    "userId": "user_123",
    "metadata": {
      "page": "/dashboard",
      "browser": "Chrome"
    }
  }'`;

  return (
    <div className="animate-in">
      <PageHeader
        title="Integration Guide"
        subtitle="Step-by-step instructions to integrate InsightX into any application"
      />

      {/* Tenant Selector */}
      {tenants.length > 1 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-[13px] text-gray-500 font-medium">Select App:</span>
          <select
            value={selectedTenant?._id || ''}
            onChange={(e) => setSelectedTenant(tenants.find(t => t._id === e.target.value))}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-[13px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-sm"
          >
            {tenants.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Step 1: Install */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Globe size={18} className="text-blue-500" />
          Step 1: Add SDK to Your Website
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Add this single script tag to your HTML. No npm install needed!
        </p>
        <CodeBlock code={htmlSnippet} id="html" />
      </div>

      {/* Step 2: Track Events */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Code size={18} className="text-emerald-500" />
          Step 2: Track Feature Usage
        </div>
        <p className="text-slate-500 text-sm mb-4">
          **Autocapture is enabled by default!** Button clicks, page views, and forms are automatically tracked.<br/><br/>
          For manual precision tracking, call <code className="text-cyan-600 bg-cyan-50 px-1 py-0.5 rounded font-mono">InsightX.trackEvent()</code> whenever a critical business funnel occurs:
        </p>
        <CodeBlock code={trackSnippet} id="track" />
      </div>

      {/* Step 3: React Integration */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Smartphone size={18} className="text-purple-500" />
          React / SPA Integration
        </div>
        <p className="text-slate-500 text-sm mb-4">
          For React, Vue, or Angular apps:
        </p>
        <CodeBlock code={reactSnippet} id="react" />
      </div>

      {/* Step 4: REST API */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Terminal size={18} className="text-orange-500" />
          REST API (Backend / Mobile)
        </div>
        <p className="text-slate-500 text-sm mb-4">
          For backend apps, mobile apps, or any HTTP client:
        </p>
        <CodeBlock code={apiSnippet} id="api" />
      </div>

      {/* What's Next */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">🎯 What Happens Next?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Events are captured', desc: 'SDK sends events to InsightX backend' },
            { step: '2', title: 'Data is stored', desc: 'Events saved securely in MongoDB with tenant isolation' },
            { step: '3', title: 'Insights generated', desc: 'View analytics on the Dashboard in real-time' },
            { step: '4', title: 'Take action', desc: 'Smart Insights page gives recommendations' },
          ].map((item) => (
            <div key={item.step} className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:border-blue-200 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">{item.step}</div>
              <div className="font-semibold text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
