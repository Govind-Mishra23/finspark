import { useState, useEffect } from 'react';
import { Plus, Copy, Check, Key, Building2 } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import PageHeader from '../components/PageHeader';

export default function Onboarding() {
  const { auth } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants', {
        headers: { 'x-admin-key': auth?.apiKey },
      });
      setTenants(res.data.tenants || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    setCreating(true);
    setError('');
    setCreated(null);
    try {
      const res = await api.post('/tenants', {
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
      });
      if (res.data.success) {
        setCreated(res.data.tenant);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        fetchTenants();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tenant');
    } finally {
      setCreating(false);
    }
  };

  const copyKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const backendUrl = window.location.origin.replace(':3000', ':5050');

  return (
    <div className="animate-in">
      <PageHeader
        title="Onboard Your App"
        subtitle="Register your application and get an API key to start tracking feature usage"
      />

      {/* Create New Tenant */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Plus size={18} className="text-blue-500" />
          Register New Application
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="App name (e.g., my_ecommerce_app)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="email"
              placeholder="Email (e.g., admin@company.com)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="password"
              placeholder="Dashboard password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {creating ? 'Creating...' : 'Register App'}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Registered Apps */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-blue-500" />
          Registered Applications ({tenants.length})
        </div>

        {tenants.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-10">
            No applications registered yet. Register your first app above!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tenants.map((t) => (
              <div key={t._id} className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">
                    {t.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Key size={12} className="text-gray-400" />
                    <code className="text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 font-mono">
                      {t.apiKey}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => copyKey(t.apiKey, t._id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copied === t._id ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'}`}
                >
                  {copied === t._id ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Key</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Integration Preview */}
      {tenants.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6 mb-6">
          <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">⚡ Quick Integration</div>
          <p className="text-slate-500 text-sm mb-4">
            Add this snippet to your app's HTML to start tracking:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl text-xs overflow-auto font-mono leading-relaxed border border-gray-800 shadow-inner">
{`<script src="${backendUrl}/sdk/insightx.js"></script>
<script>
  InsightX.init({
    apiKey: "${tenants[0]?.apiKey}",
    endpoint: "${backendUrl}",
    tenantId: "${tenants[0]?.name}"
  });

  // Track any feature usage
  InsightX.trackEvent("Button_Clicked", {
    userId: "user_123",
    page: "checkout"
  });
</script>`}
          </pre>
        </div>
      )}
    </div>
  );
}
