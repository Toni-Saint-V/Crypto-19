import { useState, useCallback } from 'react';

type Tab = "runs" | "diffs" | "logs";

interface TestResultsDrawerProps {
  onExpandedChange?: (expanded: boolean) => void;
}

export default function TestResultsDrawer({ onExpandedChange }: TestResultsDrawerProps = {}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("runs");

  const handleToggle = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  }, [isExpanded, onExpandedChange]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Collapsed header */}
      <div
        className="w-full flex items-center justify-between gap-3 px-4 py-2 flex-shrink-0"
        style={{ height: '48px', cursor: 'pointer' }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-label="Toggle test results drawer"
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-test)' }}>
            Test Sandbox
          </div>
          <div className="flex items-center gap-2 text-xs overflow-hidden min-w-0">
            <span style={{ color: 'var(--text-3)' }} className="truncate">
              Runs • Diffs • Logs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span 
            className="inline-flex h-7 items-center rounded-lg px-3 text-xs font-medium"
            style={{ 
              background: 'var(--surface-2)', 
              border: '1px solid var(--stroke)',
              color: 'var(--text-2)',
            }}
          >
            {isExpanded ? "▼" : "▲"}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Tabs + Content */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-3">
            {/* Tabs */}
            <div className="mb-2 flex items-center gap-2 text-xs flex-wrap flex-shrink-0">
              {(["runs", "diffs", "logs"] as Tab[]).map((key) => {
                const isActive = activeTab === key;
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--accent-test-bg)' : 'var(--surface-2)',
                      border: `1px solid ${isActive ? 'var(--accent-test-border)' : 'var(--stroke)'}`,
                      color: isActive ? 'var(--accent-test)' : 'var(--text-2)',
                      boxShadow: isActive ? `0 0 8px var(--accent-test-glow)` : 'none',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar text-xs space-y-3">
              <div 
                className="rounded-lg p-4 text-center"
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--stroke)',
                  color: 'var(--text-3)',
                }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                  {activeTab === "runs" && "No test runs"}
                  {activeTab === "diffs" && "No differences"}
                  {activeTab === "logs" && "No logs"}
                </div>
                <div className="text-xs">
                  {activeTab === "runs" && "Test run results will appear here"}
                  {activeTab === "diffs" && "Differences from baseline will appear here"}
                  {activeTab === "logs" && "Test execution logs will appear here"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

