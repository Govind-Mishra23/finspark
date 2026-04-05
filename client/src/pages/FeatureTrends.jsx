import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { useTenant } from '../context/TenantContext';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function FeatureTrends() {
  const { selectedTenant, tenantQuery } = useTenant();
  const [trends, setTrends] = useState([]);
  const [eventNames, setEventNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = tenantQuery ? `&${tenantQuery}` : '';
    api.get(`/analytics/trends?days=14${q}`)
      .then(res => {
        const raw = res.data.data;
        const names = new Set();
        raw.forEach(day => day.events.forEach(e => names.add(e.event)));
        const allNames = Array.from(names);
        setEventNames(allNames);

        const transformed = raw.map(day => {
          const row = { date: day.date.slice(5), total: day.total };
          allNames.forEach(name => {
            const found = day.events.find(e => e.event === name);
            row[name] = found ? found.count : 0;
          });
          return row;
        });
        setTrends(transformed);
      })
      .catch(err => console.error('Trends fetch error:', err))
      .finally(() => setLoading(false));
  }, [tenantQuery]);

  if (loading) return <Loading />;

  return (
    <div className="animate-in">
      <PageHeader
        title="Feature Trends"
        subtitle={selectedTenant ? `Daily trends for ${selectedTenant.name}` : 'Daily feature usage over the last 14 days'}
      />

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Total Events Over Time</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 12, fontSize: 13 }} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Feature Breakdown Over Time</div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trends} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3050', borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(val) => val.replace(/_/g, ' ')} />
            {eventNames.slice(0, 7).map((name, i) => (
              <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
