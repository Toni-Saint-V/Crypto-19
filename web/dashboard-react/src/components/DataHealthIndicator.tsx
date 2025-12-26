import { useState, useEffect } from 'react';

interface DataHealthIndicatorProps {
  apiBase?: string;
  className?: string;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export default function DataHealthIndicator({ apiBase = 'http://127.0.0.1:8000', className = '' }: DataHealthIndicatorProps) {
  const [status, setStatus] = useState<HealthStatus>('unknown');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkHealth = async () => {
      const t0 = Date.now();
      try {
        const controller = new AbortController();
        // Store timeout ID for cleanup
        timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const r = await fetch(`${apiBase}/health`, { 
          method: 'GET', 
          signal: controller.signal 
        });
        
        // Clear timeout if fetch completes before timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        const dt = Date.now() - t0;
        
        if (cancelled) return;

        setLatency(dt);
        
        if (r.status === 200) {
          setStatus(dt < 200 ? 'healthy' : 'degraded');
        } else {
          setStatus('unhealthy');
        }
      } catch {
        if (cancelled) return;
        setStatus('unhealthy');
        setLatency(null);
      } finally {
        // Ensure timeout is cleared even on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    checkHealth();
    intervalId = setInterval(checkHealth, 10000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [apiBase]);

  const statusConfig: Record<HealthStatus, { color: string; label: string; dot: string }> = {
    healthy: { color: 'var(--status-good)', label: 'Healthy', dot: '●' },
    degraded: { color: 'var(--status-warn)', label: 'Degraded', dot: '◐' },
    unhealthy: { color: 'var(--status-bad)', label: 'Unhealthy', dot: '○' },
    unknown: { color: 'var(--text-3)', label: 'Unknown', dot: '…' },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${className}`} style={{ color: 'var(--text-2)' }}>
      <span style={{ color: config.color, fontSize: '10px' }}>{config.dot}</span>
      <span>{config.label}</span>
      {latency !== null && (
        <span className="tabular-nums" style={{ color: 'var(--text-3)' }}>
          {latency}ms
        </span>
      )}
    </div>
  );
}

