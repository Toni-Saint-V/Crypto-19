import { Mode } from '../types';
import AIChatPanel from './AIChatPanel';

// Minimal typed TradingContext stub (UI only, no contract changes)
interface TradingContext {
  mode: Mode;
}

function createTradingContext(mode: Mode): TradingContext {
  return { mode };
}

interface SidebarProps {
  mode: Mode;
}

export default function Sidebar({ mode }: SidebarProps) {
  const context = createTradingContext(mode);
  
  return (
    <div 
      className="flex-shrink-0 flex flex-col"
      style={{ 
        width: 'var(--chat-w)',
        background: 'var(--surface-1)',
        borderLeft: '1px solid var(--stroke)',
      }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        <AIChatPanel mode={mode} context={context} />
      </div>
    </div>
  );
}
