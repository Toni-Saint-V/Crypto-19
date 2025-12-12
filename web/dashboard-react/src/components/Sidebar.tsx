import { Mode } from '../types';
import AIChatPanel from './AIChatPanel';

interface SidebarProps {
  mode: Mode;
}

export default function Sidebar({ mode }: SidebarProps) {
  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col border-l border-[#1A1C22] bg-[#05070A]">
      {/* AI Assistant occupies full height with internal scroll */}
      <div className="flex-1 overflow-hidden">
        <AIChatPanel mode={mode} />
      </div>
    </div>
  );
}
