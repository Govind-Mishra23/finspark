import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, ArrowRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import ReactiveGrid from '../components/ReactiveGrid';


export default function Login() {
  const { login } = useTenant();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdmin = async () => {
    setEmail('admin@insightx.com');
    setPassword('admin123');
    setLoading(true);
    try {
      await login('admin@insightx.com', 'admin123');
      navigate('/');
    } catch (err) {
      setError('Admin login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Immersive 3D Futuristic Background */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <img 
          src="/auth-bg.png" 
          alt="Futuristic Pipeline" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 object-center scale-105" 
        />
        {/* Core Gradients & Vignette for Depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/60 to-indigo-900/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
        
        {/* Futuristic Reactive Grid — mouse-reactive canvas */}
        <ReactiveGrid />
      </div>

      {/* Main Glass Card */}
      <div className="relative z-20 w-full max-w-md px-6 sm:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-8 drop-shadow-2xl">
          <Zap size={36} className="text-cyan-400" />
          <span className="text-4xl font-display font-bold text-white tracking-tight">InsightX</span>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">System Authentication</h1>
            <p className="text-cyan-100/60 text-sm">Secure isolated tenant access.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-cyan-200/70 uppercase tracking-widest mb-2">
                Identity Vector
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-200/70 uppercase tracking-widest mb-2 flex justify-between">
                <span>Access Key</span>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 capitalize tracking-normal font-medium">Bypass/Reset?</a>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-md">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-200 font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? 'Authenticating...' : 'Initialize Session'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={loginAsAdmin}
            className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap size={18} className="text-amber-400" /> Executive Override
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 mt-8 text-sm drop-shadow-md">
          Unregistered Node?{' '}
          <NavLink to="/signup" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            Deploy New Instance
          </NavLink>
        </p>

      </div>
    </div>
  );
}
