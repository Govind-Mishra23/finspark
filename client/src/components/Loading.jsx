export default function Loading({ text = 'Loading analytics...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 w-full">
      <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-cyan-500 animate-spin" />
      <div className="text-sm text-gray-500 font-medium animate-pulse">{text}</div>
    </div>
  );
}
