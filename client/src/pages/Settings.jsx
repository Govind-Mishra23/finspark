import { useState } from 'react';
import { Settings as SettingsIcon, Shield, CheckCircle, AlertCircle, Key, RefreshCw, Copy } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const { auth, currentTenant, isAdmin } = useTenant();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [keyMessage, setKeyMessage] = useState('');
  const [rotating, setRotating] = useState(false);
  const { updateApiKey } = useTenant();

  const email = isAdmin ? auth?.email : currentTenant?.email;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await api.put('/tenants/password', {
        email,
        oldPassword,
        newPassword
      });
      setMessage({ text: res.data.message || 'Password updated successfully.', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to update password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and security"
      />

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield size={18} className="text-purple-500" />
          Change Password
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Account: <strong className="text-gray-900 font-semibold">{email}</strong>
        </p>

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {message.text && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
              {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            className="self-start mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-xl">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Key size={18} className="text-emerald-500" />
          API Key Management
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Your API Key is required to send data from your application to InsightX. If you suspect your key has been compromised, you can rotate it below.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Current API Key</div>
            <div className="font-mono text-gray-900 font-bold">{auth?.apiKey || 'No API Key found'}</div>
          </div>
          <button 
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(auth?.apiKey);
              setKeyMessage('Copied to clipboard!');
              setTimeout(() => setKeyMessage(''), 2000);
            }}
          >
            <Copy size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              if (!window.confirm("Are you sure? Rotating your API Key will immediately invalidate your old key. Your application will stop tracking events until you update it with the new key.")) return;
              setRotating(true);
              try {
                const res = await api.post('/tenants/rotate-key', {}, {
                  headers: { 'x-api-key': auth?.apiKey }
                });
                updateApiKey(res.data.apiKey);
                setKeyMessage('API Key successfully rotated!');
              } catch (err) {
                setKeyMessage('Failed to rotate API Key.');
              }
              setRotating(false);
              setTimeout(() => setKeyMessage(''), 3000);
            }}
            disabled={rotating}
            className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={rotating ? 'animate-spin' : ''} />
            {rotating ? 'Rotating...' : 'Rotate API Key'}
          </button>
          
          {keyMessage && (
            <span className="text-sm font-semibold text-emerald-600 animate-in fade-in">{keyMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
