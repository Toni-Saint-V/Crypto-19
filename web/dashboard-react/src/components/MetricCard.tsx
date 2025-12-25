interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: 'default' | 'positive' | 'negative' | 'neutral';
  className?: string;
}

export default function MetricCard({
  label,
  value,
  sub,
  valueColor = 'default',
  className = '',
}: MetricCardProps) {
  const valueColorClass =
    valueColor === 'positive'
      ? 'text-emerald-400'
      : valueColor === 'negative'
        ? 'text-red-400'
        : valueColor === 'neutral'
          ? 'text-gray-400'
          : 'text-white';

  return (
    <div
      className={`min-w-[120px] h-[64px] px-4 py-3 bg-[#090B10] border border-[#1A1C22] rounded-xl flex flex-col justify-between ${className}`}
    >
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-sm font-semibold ${valueColorClass}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}
