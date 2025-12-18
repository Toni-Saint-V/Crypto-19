import { FormEvent, useState } from 'react';
import { ChatMessage, Mode } from '../types';

interface AIChatPanelProps {
  context?: any;
  mode: Mode;
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    content: 'Welcome to CryptoBot Pro AI Assistant. How can I help you today?',
    timestamp: Date.now(),
  },
  {
    id: '2',
    role: 'user',
    content: 'What is the current market sentiment?',
    timestamp: Date.now(),
  },
  {
    id: '3',
    role: 'ai',
    content:
      'Based on current indicators, the market shows bullish momentum with strong volume support.',
    timestamp: Date.now(),
  },
];

export default function AIChatPanel({mode, context}: AIChatPanelProps) {

  async function requestAssistant(userText: string): Promise<string> {
    try {
      const payload = {
        messages: [{ role: "user", content: userText }],
        context: (context ?? ({ mode: mode } as any)),
      };
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({} as any));
      const answer = (j && j.answer) ? String(j.answer) : `HTTP ${r.status}`;
      return answer;
    } catch {
      return "Assistant error";
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    const assistantAnswer = await requestAssistant(trimmed);

    const echo: ChatMessage = {
      id: String(Date.now() + 1),
      role: 'ai',
      content: assistantAnswer,
      timestamp: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMessage, echo]);
    setInput('');
  };

  const modeLabel =
    mode === 'live' ? 'Live trading' : mode === 'test' ? 'Test sandbox' : 'Backtest review';

  return (
    <div className="h-full flex flex-col p-6 min-h-0">
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-[11px] text-gray-500">{modeLabel}</p>
        </div>
      </div>

      <div className="flex-1 mb-3 overflow-y-auto chat-scrollbar space-y-2 pr-1 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[90%] text-xs px-3 py-2 rounded-lg ${
              m.role === 'user'
                ? 'ml-auto bg-[#1F2933]/80 backdrop-blur-sm text-gray-50'
                : 'mr-auto bg-[#0C1117]/80 backdrop-blur-sm text-gray-100 border border-[#1A1C22]/50'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-3 flex flex-wrap gap-2 flex-shrink-0">
        {[
          { label: 'Explain drawdown', action: 'Explain the current drawdown and its causes' },
          { label: 'Why entries?', action: 'Explain why these entry points were chosen' },
          { label: 'Optimize params', action: 'Suggest parameter optimizations for this strategy' },
          { label: 'Risk warnings', action: 'Analyze and highlight potential risk factors' },
        ].map((action) => (
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
              requestAssistant(action.action).then((answer) => {
                const echo: ChatMessage = {
                  id: String(Date.now() + 1),
                  role: 'ai',
                  content: answer,
                  timestamp: Date.now() + 1,
                };
                setMessages((prev) => [...prev, actionMessage, echo]);
              });
            }}
            className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-black/40 border border-white/10 text-white/70 hover:border-[#21D4B4]/50 hover:text-[#21D4B4] transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI about the market or your positions..."
          className="flex-1 bg-[#0C0F15]/80 backdrop-blur-sm border border-[#1A1C22]/50 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#21D4B4] focus:shadow-[0_0_8px_rgba(33,212,180,0.3)]"
        />
        <button
          type="submit"
          className="px-3 py-2 text-xs font-medium rounded-lg bg-[#21D4B4] text-black hover:bg-[#1bb89a] transition-colors shadow-[0_0_8px_rgba(33,212,180,0.3)]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
