import { Mode } from '../types';
import AIChatPanel from './AIChatPanel';

interface SidebarProps {
  mode: Mode;
}

export default function Sidebar({ mode }: SidebarProps) {
  return (
    <div className="w-[25%] min-w-[300px] max-w-[400px] flex-shrink-0 flex flex-col border-l border-[#1A1C22] bg-[#05070A]">
      {/* AI Assistant occupies full height with internal scroll */}
      <div className="flex-1 overflow-hidden min-h-0">
        <AIChatPanel mode={mode} />
      </div>
    </div>
  );
}
