import { NavLink } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Zap,
  UserPlus,
  Code,
  Settings as SettingsIcon,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { isAuthority } = useTenant();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-cyan-50 text-cyan-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const sectionTitleClass = "text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0 z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Zap className="text-cyan-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-purple-600">InsightX</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Feature Intelligence</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <div className={sectionTitleClass}>Analytics</div>
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/funnel" className={navLinkClass}>
          <BarChart3 size={18} /> Funnel Analysis
        </NavLink>
        <NavLink to="/trends" className={navLinkClass}>
          <TrendingUp size={18} /> Feature Trends
        </NavLink>
        <NavLink to="/insights" className={navLinkClass}>
          <Lightbulb size={18} /> Smart Insights
        </NavLink>
        <NavLink to="/ai-report" className={navLinkClass}>
          <Sparkles size={18} /> DeepInsight AI
        </NavLink>

        {!isAuthority && (
          <>
            <div className={sectionTitleClass}>Platform</div>
            <NavLink to="/onboarding" className={navLinkClass}>
              <UserPlus size={18} /> Onboard Your App
            </NavLink>
            <NavLink to="/integration" className={navLinkClass}>
              <Code size={18} /> Integration Guide
            </NavLink>
            <NavLink to="/governance" className={navLinkClass}>
              <ShieldCheck size={18} /> Governance
            </NavLink>
          </>
        )}

        {isAuthority && (
          <>
            <div className={sectionTitleClass}>Demo</div>
            <NavLink to="/demo" className={navLinkClass}>
              <Smartphone size={18} /> Loan Demo App
            </NavLink>
          </>
        )}

        <div className={sectionTitleClass}>Account</div>
        <NavLink to="/settings" className={navLinkClass}>
          <SettingsIcon size={18} /> Settings
        </NavLink>
      </nav>
    </aside>
  );
}
