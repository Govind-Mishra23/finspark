export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
