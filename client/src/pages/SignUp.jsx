import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import ReactiveGrid from '../components/ReactiveGrid';

export default function SignUp() {
  const { login } = useTenant();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/tenants', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      
      await login(email.trim(), password.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Immersive 3D Futuristic Background */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <img 
          src="/auth-bg.png" 
          alt="Futuristic Grid" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 object-center scale-105" 
        />
        {/* Core Gradients & Vignette for Depth */}
        <div className="absolute inset-0 bg-gradient-to-tl from-slate-950/90 via-slate-900/60 to-emerald-900/20 mix-blend-multiply" />
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
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Instance Deployment</h1>
            <p className="text-cyan-100/60 text-sm">Provision your isolated telemetry environment.</p>
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-cyan-200/70 uppercase tracking-widest mb-2">
                Node Identity
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cyberdyne Systems"
                className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-200/70 uppercase tracking-widest mb-2">
                Admin Vector
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@cyberdyne.io"
                className="w-full px-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-200/70 uppercase tracking-widest mb-2">
                Security Key
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
              disabled={loading || !name.trim() || !email.trim() || !password.trim()}
              className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? 'Compiling Container...' : 'Execute Deployment'} <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 mt-8 text-sm drop-shadow-md">
          Active Node Detected?{' '}
          <NavLink to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            Initialize Session
          </NavLink>
        </p>

      </div>
    </div>
  );
}
