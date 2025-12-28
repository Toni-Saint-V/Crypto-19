import { FormEvent, useState, useEffect, useRef } from 'react';
import { ChatMessage, Mode } from '../types';

interface TradingContext {
  mode: Mode;
}

interface AIChatPanelProps {
  context?: TradingContext;
  mode: Mode;
}

const getInitialMessages = (mode: Mode): ChatMessage[] => [
  {
    id: `welcome-${mode}`,
    role: 'ai',
    content: `Welcome to CryptoBot Pro AI Assistant (${mode} mode). How can I help you today?`,
    timestamp: Date.now(),
  },
];

export default function AIChatPanel({mode, context}: AIChatPanelProps) {
  const modeRef = useRef(mode);

  async function requestAssistant(userText: string): Promise<string> {
    try {
      const payload = {
        messages: [{ role: "user", content: userText }],
        context: context ?? { mode: mode },
      };
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({} as any));
      if (j && j.answer) {
        return String(j.answer);
      }
      // Don't show HTTP codes - show human message + request_id if available
      const errorMsg = j?.error || j?.message || "Assistant temporarily unavailable";
      const requestId = j?.request_id || j?.requestId || "";
      return requestId ? `${errorMsg} (request: ${requestId})` : errorMsg;
    } catch {
      return "Assistant error";
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(mode));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset messages on mode change
  useEffect(() => {
    if (modeRef.current !== mode) {
      modeRef.current = mode;
      setMessages(getInitialMessages(mode));
      setIsLoading(false);
    }
  }, [mode]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    
    // Optimistic update: add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'ai',
      content: '...',
      timestamp: Date.now() + 1,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const assistantAnswer = await requestAssistant(trimmed);
      
      // Check if mode changed during request
      if (modeRef.current !== mode) {
        return;
      }

      // Replace loading message with actual answer
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== loadingMessage.id);
        const echo: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: assistantAnswer,
          timestamp: Date.now(),
        };
        return [...filtered, echo];
      });
    } catch (error) {
      // Replace loading message with error
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== loadingMessage.id);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        };
        return [...filtered, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

    const modeLabel =
    mode === 'LIVE'
      ? 'Live Trading'
      : mode === 'TEST'
        ? 'Simulated (no risk)'
        : 'Historical Analysis';

  const modeAccents: Record<Mode, { color: string; bg: string; border: string }> = {
    BACKTEST: {
      color: 'var(--accent-backtest)',
      bg: 'var(--accent-backtest-bg)',
      border: 'var(--accent-backtest-border)',
    },
    LIVE: {
      color: 'var(--accent-live)',
      bg: 'var(--accent-live-bg)',
      border: 'var(--accent-live-border)',
    },
    TEST: {
      color: 'var(--accent-test)',
      bg: 'var(--accent-test-bg)',
      border: 'var(--accent-test-border)',
    },
  };

  const accent = modeAccents[mode];

  // Mode-specific quick actions
  const getQuickActions = () => {
    switch (mode) {
      case 'BACKTEST':
        return [
          { label: 'Explain drawdown', action: 'Explain the current drawdown and its causes' },
          { label: 'Why entries?', action: 'Explain why these entry points were chosen' },
          { label: 'Optimize params', action: 'Suggest parameter optimizations for this strategy' },
          { label: 'Risk checks', action: 'Analyze and highlight potential risk factors' },
        ];
      case 'LIVE':
        return [
          { label: 'Risk warnings', action: 'Check for current risk warnings' },
          { label: 'Data health', action: 'Check data feed health and latency' },
          { label: 'Reconnect', action: 'Help troubleshoot connection issues' },
        ];
      case 'TEST':
        return [
          { label: 'What changed?', action: 'What changed compared to baseline?' },
          { label: 'Why different?', action: 'Why is the result different from expected?' },
          { label: 'Diagnose', action: 'Help diagnose test failures' },
        ];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="h-full flex flex-col min-h-0" style={{ background: 'var(--surface-1)' }}>
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--stroke)' }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Assistant</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{ 
                background: accent.bg, 
                color: accent.color,
                border: `1px solid ${accent.border}`,
              }}
            >
              {modeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Signal Quality + Risk Score (mini cards) */}
      <div className="px-4 py-2 flex gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--stroke)' }}>
        <div 
          className="flex-1 px-2 py-1.5 rounded text-xs"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
        >
          <div style={{ color: 'var(--text-3)' }}>Signal Quality</div>
          <div className="font-semibold mt-0.5" style={{ color: 'var(--text-1)' }}>Good</div>
        </div>
        <div 
          className="flex-1 px-2 py-1.5 rounded text-xs"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--stroke)' }}
        >
          <div style={{ color: 'var(--text-3)' }}>Risk Score</div>
          <div className="font-semibold mt-0.5" style={{ color: 'var(--text-1)' }}>Low</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex flex-wrap gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--stroke)' }}>
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              const actionMessage: ChatMessage = {
                id: String(Date.now()),
                role: 'user',
                content: action.action,
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, actionMessage]);
              setIsLoading(true);
              const loadingMsg: ChatMessage = {
                id: `loading-${Date.now()}`,
                role: 'ai',
                content: '...',
                timestamp: Date.now() + 1,
              };
              setMessages((prev) => [...prev, loadingMsg]);
              
              requestAssistant(action.action).then((answer) => {
                if (modeRef.current !== mode) return;
                setMessages((prev) => {
                  const filtered = prev.filter(m => m.id !== loadingMsg.id);
                  const echo: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    role: 'ai',
                    content: answer,
                    timestamp: Date.now(),
                  };
                  return [...filtered, echo];
                });
              }).catch(() => {
                if (modeRef.current !== mode) return;
                setMessages((prev) => {
                  const filtered = prev.filter(m => m.id !== loadingMsg.id);
                  const errorMsg: ChatMessage = {
                    id: `error-${Date.now()}`,
                    role: 'ai',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: Date.now(),
                  };
                  return [...filtered, errorMsg];
                });
              }).finally(() => {
                setIsLoading(false);
              });
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-lg transition-all hover:opacity-80"
            style={{
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              color: accent.color,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages (scrollable) */}
      <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-3 space-y-2 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] text-xs px-3 py-2 rounded-lg ${
              m.role === 'user'
                ? 'ml-auto'
                : 'mr-auto'
            } ${m.content === '...' ? 'opacity-50' : ''}`}
            style={{
              background: m.role === 'user' 
                ? accent.bg 
                : 'var(--surface-2)',
              border: `1px solid ${m.role === 'user' ? accent.border : 'var(--stroke)'}`,
              color: 'var(--text-1)',
            }}
          >
            {m.content === '...' ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-75">●</span>
                <span className="animate-pulse delay-150">●</span>
              </span>
            ) : (
              m.content
            )}
          </div>
        ))}
      </div>

      {/* Input (pinned bottom) */}
      <div 
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--stroke)', background: 'var(--surface-1)' }}
      >
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask AI..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-xs rounded-lg transition-all focus:outline-none disabled:opacity-50"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--stroke)',
              color: 'var(--text-1)',
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-2 text-xs font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: accent.bg,
              border: `1px solid ${accent.border}`,
              color: accent.color,
              boxShadow: `0 0 8px var(--accent-${mode}-glow)`,
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
