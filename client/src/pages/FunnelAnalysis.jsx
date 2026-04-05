import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';

const STEP_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export default function FunnelAnalysis() {
  const { selectedTenant, tenantQuery } = useTenant();
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = tenantQuery ? `?${tenantQuery}` : '';
    api.get(`/analytics/funnel${q}`)
      .then(res => setFunnel(res.data.data))
      .catch(err => console.error('Funnel fetch error:', err))
      .finally(() => setLoading(false));
  }, [tenantQuery]);

  if (loading) return <Loading />;

  const maxUsers = funnel.length > 0 ? Math.max(...funnel.map(f => f.uniqueUsers)) : 1;

  return (
    <div className="animate-in">
      <PageHeader
        title="Funnel Analysis"
        subtitle={selectedTenant ? `Loan journey for ${selectedTenant.name}` : 'Loan journey drop-off analysis — Apply → Upload → KYC → Approval'}
      />

      <div className="flex flex-col gap-4 mb-8">
        {funnel.map((step, i) => {
          const pct = maxUsers > 0 ? (step.uniqueUsers / maxUsers) * 100 : 0;
          return (
            <div key={step.step} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0" style={{ background: `${STEP_COLORS[i]}15`, color: STEP_COLORS[i] }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-2.5 text-lg">{step.label}</div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-2xl">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: STEP_COLORS[i] }} />
                </div>
              </div>
              <div className="text-right shrink-0 min-w-[120px]">
                <div className="text-2xl font-bold tracking-tight" style={{ color: STEP_COLORS[i] }}>{step.uniqueUsers}</div>
                {step.dropOff > 0 && (
                  <div className={`text-xs font-semibold mt-1.5 ${step.dropOff < 20 ? 'text-green-500' : 'text-red-500'}`}>↓ {step.dropOff}% drop</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500" /> Funnel Comparison (Unique Users per Step)</div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={funnel} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
            <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 12, fontSize: 13 }} />
            <Bar dataKey="uniqueUsers" radius={[6, 6, 0, 0]} barSize={60}>
              {funnel.map((_, i) => (<Cell key={i} fill={STEP_COLORS[i % STEP_COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
