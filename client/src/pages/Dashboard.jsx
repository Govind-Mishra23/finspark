import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Activity, Users, Star, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import KPICard from '../components/KPICard';
import Loading from '../components/Loading';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-100 font-semibold text-sm mb-1">
          {label?.replace(/_/g, ' ')}
        </p>
        <p className="text-blue-400 text-sm font-bold">
          {payload[0].value.toLocaleString()} events
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { selectedTenant, tenantQuery } = useTenant();
  const [summary, setSummary] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const q = tenantQuery ? `?${tenantQuery}` : '';
      const [sumRes, featRes] = await Promise.all([
        api.get(`/analytics/summary${q}`),
        api.get(`/analytics/feature-usage${q}`),
      ]);
      setSummary(sumRes.data.data);
      setFeatures(featRes.data.data.map(f => ({
        ...f,
        name: f.feature.replace(/_/g, ' '),
      })));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantQuery]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <Loading />;

  return (
    <div className="animate-in">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {selectedTenant
              ? `Analytics for ${selectedTenant.name}`
              : 'Overview of feature usage across all tenants'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} /> {lastUpdated}
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span className="text-xs text-emerald-500 font-semibold">LIVE</span>
          <button
            onClick={() => fetchData(true)}
            className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-600 cursor-pointer flex items-center gap-1.5 text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard label="Total Events" value={summary?.totalEvents?.toLocaleString() || '0'} sub="Last 30 days" icon={Activity} color="blue" />
        <KPICard label="Active Users" value={summary?.activeUsers?.toLocaleString() || '0'} sub="Unique users tracked" icon={Users} color="green" />
        <KPICard label="Top Feature" value={summary?.topFeature || 'N/A'} sub={`${summary?.topFeatureCount || 0} events`} icon={Star} color="purple" />
        <KPICard label="Drop-off Rate" value={`${summary?.dropOffRate || 0}%`} sub="Loan funnel drop-off" icon={TrendingDown} color="orange" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Activity size={18} className="text-blue-500" /> Feature Usage Overview</div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={features} margin={{ top: 10, right: 30, left: 10, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-35} textAnchor="end" height={80} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
              {features.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
