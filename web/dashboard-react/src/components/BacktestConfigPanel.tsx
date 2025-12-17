type Props = {
  value?: any;
  onChange?: (next: any) => void;
  onRun?: () => void;
  disabled?: boolean;
};

export default function BacktestConfigPanel(props: Props) {
  const { value, onChange, onRun, disabled } = props;

  const v = value || {};
  const set = (patch: any) => {
    try {
      onChange && onChange({ ...v, ...patch });
    } catch (e) {
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>From</span>
          <input
            type="date"
            value={v?.dateRange?.from || ''}
            onChange={(e) => set({ dateRange: { ...(v.dateRange || {}), from: e.target.value } })}
            disabled={disabled}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>To</span>
          <input
            type="date"
            value={v?.dateRange?.to || ''}
            onChange={(e) => set({ dateRange: { ...(v.dateRange || {}), to: e.target.value } })}
            disabled={disabled}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Initial</span>
          <input
            type="number"
            value={v?.initialBalance ?? 1000}
            onChange={(e) => set({ initialBalance: Number(e.target.value) })}
            disabled={disabled}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Fees (bps)</span>
          <input
            type="number"
            value={v?.feesBps ?? 6}
            onChange={(e) => set({ feesBps: Number(e.target.value) })}
            disabled={disabled}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Slippage (bps)</span>
          <input
            type="number"
            value={v?.slippageBps ?? 2}
            onChange={(e) => set({ slippageBps: Number(e.target.value) })}
            disabled={disabled}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onRun} disabled={disabled || !onRun}>
          Run backtest
        </button>
      </div>
    </div>
  );
}
