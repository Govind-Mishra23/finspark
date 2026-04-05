import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export default function SmartInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/insights')
      .then(res => setInsights(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={20} className="text-orange-500" />;
      case 'success': return <CheckCircle2 size={20} className="text-emerald-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  return (
    <div>
      <PageHeader 
        title="Smart Insights" 
        subtitle="Rule-based statistical insights generated directly from your tracking data."
      />

      {insights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-6">
          <p className="text-gray-500">Not enough data to generate rule-based insights yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {insights.map((insight, i) => (
            <div key={i} className={`p-6 rounded-2xl border flex gap-4 ${getTypeStyles(insight.type)}`}>
              <div className="shrink-0 mt-1">
                {getTypeIcon(insight.type)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg">{insight.title}</h3>
                  <span className="px-2 py-0.5 bg-white/50 rounded text-xs font-semibold uppercase tracking-wider mix-blend-multiply">
                    {insight.category}
                  </span>
                </div>
                <p className="text-sm opacity-90 leading-relaxed max-w-md">
                  {insight.description}
                </p>
                {insight.metric && (
                  <div className="mt-4 text-2xl font-bold font-display opacity-80">
                    {insight.metric}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
