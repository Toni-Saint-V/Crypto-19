interface MetricChipProps {
  label: string;
  value: string | number;
  valueColor?: 'default' | 'positive' | 'negative' | 'neutral';
  className?: string;
}

export default function MetricChip({
  label,
  value,
  valueColor = 'default',
  className = '',
}: MetricChipProps) {
  const valueColorClass =
    valueColor === 'positive'
      ? 'text-emerald-400'
      : valueColor === 'negative'
        ? 'text-red-400'
        : valueColor === 'neutral'
          ? 'text-gray-400'
          : 'text-gray-100';

  return (
    <div
      className={`bg-[#090B10] border border-[#1A1C22] rounded-lg px-3 py-2 ${className}`}
    >
      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
      <div className={`text-sm font-semibold ${valueColorClass}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
