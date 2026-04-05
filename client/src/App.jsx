import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider, useTenant } from './context/TenantContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FunnelAnalysis from './pages/FunnelAnalysis';
import FeatureTrends from './pages/FeatureTrends';
import SmartInsights from './pages/SmartInsights';
import AiGrowthReport from './pages/AiGrowthReport';
import LoanDemo from './pages/LoanDemo';
import Onboarding from './pages/Onboarding';
import IntegrationGuide from './pages/IntegrationGuide';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Settings from './pages/Settings';
import Governance from './pages/Governance';

function ProtectedLayout({ children }) {
  const { isAuthority, currentTenant, logout } = useTenant();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Top bar with auth info */}
        <div className="flex justify-end items-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold
            ${isAuthority ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-cyan-50 border-cyan-200 text-cyan-600'}`
          }>
            <span className={`w-2 h-2 rounded-full ${isAuthority ? 'bg-purple-500' : 'bg-cyan-500'}`} />
            <span>
              {isAuthority ? '🛡️ Demo App Authority' : `🏢 ${currentTenant?.name || 'Loading...'}`}
            </span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg border bg-red-50 border-red-200 text-red-500 hover:bg-red-100 transition-colors text-sm font-semibold"
          >
            Logout
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}

function MainRoutes() {
  const { isLoggedIn, isAuthority } = useTenant();

  // Public Landing / Auth routing block
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Dashboard / Authenticated routing block
  return (
    <Routes>
      <Route path="/*" element={
        <ProtectedLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/funnel" element={<FunnelAnalysis />} />
            <Route path="/trends" element={<FeatureTrends />} />
            <Route path="/insights" element={<SmartInsights />} />
            <Route path="/ai-report" element={<AiGrowthReport />} />
            
            {!isAuthority && <Route path="/onboarding" element={<Onboarding />} />}
            {!isAuthority && <Route path="/integration" element={<IntegrationGuide />} />}
            {!isAuthority && <Route path="/governance" element={<Governance />} />}
            {isAuthority && <Route path="/demo" element={<LoanDemo />} />}
            
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ProtectedLayout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <TenantProvider>
        <MainRoutes />
      </TenantProvider>
    </Router>
  );
}

export default App;
