import { useState } from 'react';
import TopBar from './components/TopBar';
import AIPredictorStrip from './components/AIPredictorStrip';
import LiveTradesTicker from './components/LiveTradesTicker';
import ChartArea from './components/ChartArea';
import Sidebar from './components/Sidebar';
import { Mode } from './types';

function App() {
  const [mode, setMode] = useState<Mode>('live');
  const [symbol] = useState('ETHUSDT');
  const [exchange] = useState('Bybit');
  const [timeframe, setTimeframe] = useState('15m');
  const [strategy] = useState('Mean Reversion v2');
  const [balance] = useState(10000);

  return (
    <div className="h-screen w-screen bg-[#05070A] text-gray-100 flex justify-center items-center overflow-hidden p-2">
      <div className="w-full h-full max-w-[1440px] max-h-[900px] bg-gradient-to-br from-[#05070A] to-[#0D1015] border border-[#1A1C22] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <TopBar
          mode={mode}
          onModeChange={setMode}
          symbol={symbol}
          exchange={exchange}
          balance={balance}
        />

        <AIPredictorStrip />

        <LiveTradesTicker mode={mode} />

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <ChartArea
              mode={mode}
              symbol={symbol}
              exchange={exchange}
              timeframe={timeframe}
              strategy={strategy}
              onTimeframeChange={setTimeframe}
            />
          </div>

          <Sidebar mode={mode} />
        </div>
      </div>
    </div>
  );
}

export default App;
