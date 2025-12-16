import { Mode } from '../types';
import AIChatPanel from './AIChatPanel';

interface SidebarProps {
  mode: Mode;
}

export default function Sidebar({ mode }: SidebarProps) {
  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col border-l border-t border-[#1A1C22] bg-[#05070A]">
      <div className="flex-1 overflow-hidden min-h-0">
        <AIChatPanel mode={mode}  context={ { mode: mode } as any } />
      </div>
    </div>
  );
}
