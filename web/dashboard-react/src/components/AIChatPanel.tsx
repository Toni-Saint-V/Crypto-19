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
                ? 'ml-auto bg-[#1F2933] text-gray-50'
                : 'mr-auto bg-[#0C1117] text-gray-100 border border-[#1A1C22]'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI about the market or your positions..."
          className="flex-1 bg-[#0C0F15] border border-[#1A1C22] rounded-lg px-3 py-2 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#21D4B4]"
        />
        <button
          type="submit"
          className="px-3 py-2 text-xs font-medium rounded-lg bg-[#21D4B4] text-black hover:bg-[#1bb89a] transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
