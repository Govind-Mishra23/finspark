export default function KPICard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const bgStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all hover:shadow-md hover:border-gray-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${bgStyle}`}>
        <Icon size={20} />
      </div>
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs font-semibold text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
