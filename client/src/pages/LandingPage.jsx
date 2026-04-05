import { Link } from 'react-router-dom';
import { Sparkles, BarChart3, ShieldCheck, Zap, Code, ChevronRight, Terminal } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center" */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="text-indigo-400" size={28} />
            <span className="text-xl font-display font-bold text-white tracking-tight">InsightX</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 text-center lg:pt-36 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500 opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <a href="#features" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm font-semibold mb-8 hover:bg-indigo-500/20 transition-colors">
          <Sparkles size={16} /> Introducing DeepInsight AI Generation 2
        </a>
        
        <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight mb-8 leading-tight">
          Ship features faster.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Know exactly what works.
          </span>
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          The ultimate multi-tenant analytics engine. Drop one line of code into your application and instantly unlock isolated funnel tracking, predictive AI conversion insights, and beautiful feature dashboards.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-xl hover:bg-slate-100 transition-all text-lg flex items-center justify-center gap-2 group">
            Start Tracking Free
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#integration" className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-lg flex items-center justify-center gap-2">
            View Documentation
          </a>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">Everything an engineering team needs</h2>
          <p className="text-slate-400">Zero configuration. Total physical database isolation. Real-time cognitive tracking.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-indigo-500/30 transition-colors">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">DeepInsight AI Engine</h3>
            <p className="text-slate-400 leading-relaxed">Powered by Gemini 2.5 Flash, automatically generating specific tactical maneuvers to patch conversion bottlenecks.</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Military-Grade Isolation</h3>
            <p className="text-slate-400 leading-relaxed">Every newly onboarded tenant receives a physically segregated MongoDB collection to guarantee zero data leakage.</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-cyan-500/30 transition-colors">
            <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Frictionless Funnels</h3>
            <p className="text-slate-400 leading-relaxed">Visualize exactly where your users are abandoning complex flows like KYC uploads or checkout carts instantly.</p>
          </div>
        </div>
      </div>

      {/* Comprehensive Integration Pipeline Section */}
      <div id="integration" className="max-w-5xl mx-auto px-6 py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500 opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="text-center mb-24 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6 tracking-tight">Deploy in 3 Minutes.</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Forget bloated SDKs and complex configurations. InsightX is designed for rapid integration so you can start tracking conversions immediately.
          </p>
        </div>

        <div className="relative space-y-16 lg:space-y-24 z-10">
          {/* Vertical Line */}
          <div className="absolute left-8 lg:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-cyan-500/20 to-transparent -translate-x-1/2 hidden sm:block"></div>

          {/* STEP 1 */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 lg:gap-16">
            <div className="w-full sm:w-1/2 lg:text-right lg:pr-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-display font-bold text-xl mb-6 sm:hidden">1</div>
              <h3 className="text-2xl font-bold text-white mb-4">Provision your API Key</h3>
              <p className="text-slate-400 leading-relaxed">
                Create your isolated Tenant Instance. Our system immediately provisions a secure, segregated MongoDB collection and generates your unique <code className="text-indigo-300">INSIGHTX_KEY</code> on the dashboard.
              </p>
            </div>
            
            <div className="absolute left-8 lg:left-1/2 w-12 h-12 rounded-2xl bg-slate-900 border border-indigo-500 text-indigo-400 flex items-center justify-center font-display font-bold text-xl z-20 shadow-[0_0_20px_rgba(99,102,241,0.3)] -translate-x-1/2 hidden sm:flex">
              1
            </div>

            <div className="w-full sm:w-1/2 lg:pl-12">
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="text-indigo-400" size={20} />
                    <span className="font-semibold text-white">Your Credentials</span>
                  </div>
                  <button className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg font-mono">Copy Key</button>
                </div>
                <div className="font-mono text-sm text-slate-300 break-all leading-relaxed">
                  INSIGHTX_KEY=ix_live_8f7d9a2c3b4e...
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="relative flex flex-col sm:flex-row-reverse items-center justify-between gap-8 lg:gap-16">
            <div className="w-full sm:w-1/2 lg:pl-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-display font-bold text-xl mb-6 sm:hidden">2</div>
              <h3 className="text-2xl font-bold text-white mb-4">Inject the Tracker SDK</h3>
              <p className="text-slate-400 leading-relaxed">
                No massive npm bundles. Simply drop our lightning-fast, asynchronous initializing script directly into your application's root component or HTML head.
              </p>
            </div>
            
            <div className="absolute left-8 lg:left-1/2 w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500 text-cyan-400 flex items-center justify-center font-display font-bold text-xl z-20 shadow-[0_0_20px_rgba(6,182,212,0.3)] -translate-x-1/2 hidden sm:flex">
              2
            </div>

            <div className="w-full sm:w-1/2 lg:pr-12 text-left">
              <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <span className="ml-2 text-xs font-mono text-slate-400">index.html</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <code className="text-sm font-mono leading-relaxed whitespace-pre">
                    <span className="text-slate-500">&lt;!-- Add to your root --&gt;</span>{'\n'}
                    <span className="text-cyan-400">&lt;script</span> <span className="text-blue-300">src</span>=<span className="text-emerald-300">"https://api.insightx.com/sdk.js"</span><span className="text-cyan-400">&gt;&lt;/script&gt;</span>{'\n'}
                    <span className="text-cyan-400">&lt;script&gt;</span>{'\n'}
                    {'  '}InsightX.<span className="text-purple-400">init</span>({'{'}{'\n'}
                    {'    '}apiKey: <span className="text-emerald-300">"ix_live_..."</span>,{'\n'}
                    {'    '}tenantId: <span className="text-emerald-300">"cyberdyne_sys"</span>{'\n'}
                    {'  '}{'}'});{'\n'}
                    <span className="text-cyan-400">&lt;/script&gt;</span>
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 lg:gap-16">
            <div className="w-full sm:w-1/2 lg:text-right lg:pr-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-display font-bold text-xl mb-6 sm:hidden">3</div>
              <h3 className="text-2xl font-bold text-white mb-4">Zero-Code Autocapture</h3>
              <p className="text-slate-400 leading-relaxed">
                The <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">insightx.js</code> engine automatically binds to your DOM. Every button click, {'<a href>'} navigation, and form submission is instantly captured and sent to your cloud dashboard. No <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">trackEvent()</code> required!
              </p>
            </div>
            
            <div className="absolute left-8 lg:left-1/2 w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-500 text-emerald-400 flex items-center justify-center font-display font-bold text-xl z-20 shadow-[0_0_20px_rgba(16,185,129,0.3)] -translate-x-1/2 hidden sm:flex">
              3
            </div>

            <div className="w-full sm:w-1/2 lg:pl-12">
              <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <span className="ml-2 text-xs font-mono text-slate-400">Terminal Output</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <code className="text-sm font-mono leading-relaxed whitespace-pre">
                    <span className="text-slate-500">[InsightX] Initialized. Monitoring DOM...</span>{'\n'}
                    <span className="text-cyan-400">Captured Event:</span> {'{'}{'\n'}
                    {'  '}type: <span className="text-emerald-300">"Interaction_Click"</span>,{'\n'}
                    {'  '}element: <span className="text-orange-400">"button"</span>,{'\n'}
                    {'  '}text: <span className="text-emerald-300">"Complete Purchase"</span>{'\n'}
                    {'}'}{'\n'}
                    <span className="text-slate-500">[InsightX] Payload delivered.</span>
                  </code>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
