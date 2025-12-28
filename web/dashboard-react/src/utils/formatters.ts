// Number formatting utilities (small + dependency-free)

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function abbreviateNumber(absValue: number): string {
  const fmt = (n: number, suffix: string) => {
    const s = n.toFixed(1);
    return `${s.endsWith('.0') ? s.slice(0, -2) : s}${suffix}`;
  };
  if (absValue >= 1_000_000_000) return fmt(absValue / 1_000_000_000, 'B');
  if (absValue >= 1_000_000) return fmt(absValue / 1_000_000, 'M');
  if (absValue >= 1_000) return fmt(absValue / 1_000, 'K');
  return String(absValue);
}

export function formatCurrency(
  value: number | null | undefined,
  options?: { abbreviate?: boolean; showSign?: boolean }
): string {
  if (!isFiniteNumber(value)) return '—';

  const { abbreviate = Math.abs(value) >= 100_000, showSign = true } = options ?? {};
  const sign = showSign && value > 0 ? '+' : '';

  if (abbreviate && Math.abs(value) >= 1_000) {
    const prefix = value < 0 ? '-' : sign;
    return `${prefix}$${abbreviateNumber(Math.abs(value))}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (value < 0) return `-${formatted}`;
  if (showSign && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatPercent(
  value: number | null | undefined,
  options?: { decimals?: number; showSign?: boolean }
): string {
  if (!isFiniteNumber(value)) return '—';
  const { decimals = 1, showSign = true } = options ?? {};
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatInteger(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatNumber(value: number | null | undefined, digits: number = 2): string {
  if (!isFiniteNumber(value)) return '—';
  return value.toFixed(digits);
}

export function formatCrypto(value: number | null | undefined, symbol?: string): string {
  if (!isFiniteNumber(value)) return '—';
  const formatted = value.toFixed(8).replace(/\.?0+$/, '');
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatTimestamp(date: Date | number | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'number' ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function isStaleTimestampMs(timestampMs: number, staleAfterMs: number = 5 * 60 * 1000): boolean {
  if (!Number.isFinite(timestampMs)) return false;
  return Date.now() - timestampMs > staleAfterMs;
}


