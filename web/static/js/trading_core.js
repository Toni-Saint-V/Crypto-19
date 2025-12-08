/**
 * CryptoBot Pro - Trading Core Frontend
 * WebSocket connections, Chart.js integration, and AI chat
 */

// ============================================
// Global State
// ============================================

let chart = null;
let wsAI = null;
let wsTrades = null;
let isRunning = false;
let chartData = {
  labels: [],
  equity: [],
  price: [],
  confidence: [],
  buyMarkers: [],
  sellMarkers: []
};
let messageHistory = [];
const MAX_MESSAGES = 10;

// ============================================
// Chart Initialization
// ============================================

function initializeChart() {
  const ctx = document.getElementById('mainChart').getContext('2d');
  
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'Equity',
          data: chartData.equity,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Price',
          data: chartData.price,
          borderColor: '#5af3ff',
          backgroundColor: 'rgba(90, 243, 255, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y1'
        },
        {
          label: 'Confidence',
          data: chartData.confidence,
          borderColor: '#aa55ff',
          backgroundColor: 'rgba(170, 85, 255, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: 'y2',
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#e6e6f2',
            font: {
              size: 11,
              family: 'Inter'
            },
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(14, 14, 31, 0.95)',
          titleColor: '#00ffe0',
          bodyColor: '#e6e6f2',
          borderColor: '#00ffe0',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(2);
              if (context.dataset.label === 'Price') {
                label += ' USDT';
              } else if (context.dataset.label === 'Confidence') {
                label += '%';
              } else {
                label += '%';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(26, 26, 53, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#a0a0c0',
            font: {
              size: 10
            },
            maxTicksLimit: 10
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(26, 26, 53, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#a0a0c0',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(2) + '%';
            }
          },
          title: {
            display: true,
            text: 'Equity (%)',
            color: '#00ff88',
            font: {
              size: 11
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: '#5af3ff',
            font: {
              size: 10
            },
            callback: function(value) {
              return value.toFixed(0);
            }
          },
          title: {
            display: true,
            text: 'Price (USDT)',
            color: '#5af3ff',
            font: {
              size: 11
            }
          }
        },
        y2: {
          type: 'linear',
          display: false
        }
      },
      animation: {
        duration: 750
      }
    }
  });
  
  // Initialize with sample data
  loadInitialData();
}

// ============================================
// WebSocket Connections
// ============================================

function connectWebSockets() {
  connectAIWebSocket();
  connectTradesWebSocket();
}

function connectAIWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/ai`;
  
  wsAI = new WebSocket(wsUrl);
  
  wsAI.onopen = () => {
    console.log('✅ AI WebSocket connected');
    updateConnectionStatus(true);
    addChatMessage('system', 'AI WebSocket connected. Ready to chat.');
  };
  
  wsAI.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleAIMessage(data);
    } catch (error) {
      console.error('Error parsing AI message:', error);
    }
  };
  
  wsAI.onerror = (error) => {
    console.error('AI WebSocket error:', error);
    addChatMessage('system', 'WebSocket error occurred.');
  };
  
  wsAI.onclose = () => {
    console.log('🔴 AI WebSocket disconnected');
    updateConnectionStatus(false);
    addChatMessage('system', 'AI WebSocket disconnected. Reconnecting...');
    // Reconnect after 3 seconds
    setTimeout(connectAIWebSocket, 3000);
  };
}

function connectTradesWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/trades`;
  
  wsTrades = new WebSocket(wsUrl);
  
  wsTrades.onopen = () => {
    console.log('✅ Trades WebSocket connected');
    updateConnectionStatus(true);
  };
  
  wsTrades.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleTradeSignal(data);
    } catch (error) {
      console.error('Error parsing trade message:', error);
    }
  };
  
  wsTrades.onerror = (error) => {
    console.error('Trades WebSocket error:', error);
  };
  
  wsTrades.onclose = () => {
    console.log('🔴 Trades WebSocket disconnected');
    // Reconnect after 3 seconds
    setTimeout(connectTradesWebSocket, 3000);
  };
}

// ============================================
// Message Handlers
// ============================================

function handleAIMessage(data) {
  if (data.type === 'message' || data.type === 'response') {
    // Chat message
    addChatMessage('ai', data.message || data.text || JSON.stringify(data));
  } else if (data.type === 'data' || data.type === 'update') {
    // Data update (confidence, risk, PNL)
    if (data.payload) {
      updateMetrics(data.payload);
      updateChartData(data.payload);
    }
  } else if (data.type === 'system') {
    // System message
    addChatMessage('system', data.message || data.text);
  }
}

function handleTradeSignal(data) {
  if (data.type === 'trade' || data.side) {
    // Trade signal
    addSignal('trade', `[TRADE] ${data.side?.toUpperCase()} ${data.symbol || 'BTCUSDT'} @ ${data.price?.toFixed(2) || 'N/A'}`);
    
    // Add marker to chart
    if (data.side === 'buy') {
      addBuyMarker(data.timestamp || Date.now(), data.price);
    } else if (data.side === 'sell') {
      addSellMarker(data.timestamp || Date.now(), data.price);
    }
    
    // Update equity if provided
    if (data.equity !== undefined) {
      updateEquity(data.equity);
    }
  } else if (data.type === 'signal') {
    // General signal
    addSignal('new', data.message || JSON.stringify(data));
  }
}

// ============================================
// Chart Updates
// ============================================

function loadInitialData() {
  // Load backtest data on init
  fetch('/api/backtest')
    .then(response => response.json())
    .then(data => {
      if (data.equity_curve && data.equity_curve.length > 0) {
        const baseEquity = 100;
        chartData.labels = data.equity_curve.map((_, i) => `T${i + 1}`);
        chartData.equity = data.equity_curve.map((val, i) => {
          if (i === 0) return baseEquity;
          return ((val / data.equity_curve[0]) * baseEquity) - baseEquity;
        });
        
        // Generate sample price and confidence data
        const basePrice = 42000;
        chartData.price = data.equity_curve.map((_, i) => 
          basePrice + (Math.random() - 0.5) * 1000
        );
        chartData.confidence = data.equity_curve.map(() => 
          Math.random() * 30 + 60
        );
        
        updateChart();
      }
    })
    .catch(error => {
      console.error('Error loading backtest data:', error);
      // Use empty data
      initializeEmptyChart();
    });
}

function initializeEmptyChart() {
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    chartData.labels.push(new Date(now - (50 - i) * 60000).toLocaleTimeString());
    chartData.equity.push(0);
    chartData.price.push(42000);
    chartData.confidence.push(70);
  }
  updateChart();
}

function updateChartData(payload) {
  if (!chart) return;
  
  const now = new Date().toLocaleTimeString();
  
  // Add new data point
  chartData.labels.push(now);
  if (chartData.labels.length > 100) {
    chartData.labels.shift();
    chartData.equity.shift();
    chartData.price.shift();
    chartData.confidence.shift();
  }
  
  // Update values
  if (payload.equity !== undefined) {
    chartData.equity.push(payload.equity);
  } else if (chartData.equity.length > 0) {
    const lastEquity = chartData.equity[chartData.equity.length - 1];
    chartData.equity.push(lastEquity + (Math.random() - 0.5) * 0.5);
  } else {
    chartData.equity.push(0);
  }
  
  if (payload.price !== undefined) {
    chartData.price.push(payload.price);
  } else if (chartData.price.length > 0) {
    const lastPrice = chartData.price[chartData.price.length - 1];
    chartData.price.push(lastPrice + (Math.random() - 0.5) * 100);
  } else {
    chartData.price.push(42000);
  }
  
  if (payload.confidence !== undefined) {
    chartData.confidence.push(payload.confidence);
  } else if (chartData.confidence.length > 0) {
    const lastConf = chartData.confidence[chartData.confidence.length - 1];
    chartData.confidence.push(Math.max(0, Math.min(100, lastConf + (Math.random() - 0.5) * 5)));
  } else {
    chartData.confidence.push(70);
  }
  
  updateChart();
}

function updateEquity(newEquity) {
  if (!chart || chartData.equity.length === 0) return;
  
  const baseEquity = chartData.equity[0] || 100;
  const equityChange = ((newEquity / baseEquity) * 100) - 100;
  
  chartData.equity[chartData.equity.length - 1] = equityChange;
  updateChart();
}

function addBuyMarker(timestamp, price) {
  if (!chart) return;
  
  // Add visual marker (annotation would require chartjs-plugin-annotation)
  // For now, we'll add a data point highlight
  const index = chartData.labels.length - 1;
  if (index >= 0) {
    // Create a temporary dataset for markers or use annotations plugin
    console.log(`Buy marker at ${timestamp}, price: ${price}`);
  }
}

function addSellMarker(timestamp, price) {
  if (!chart) return;
  
  const index = chartData.labels.length - 1;
  if (index >= 0) {
    console.log(`Sell marker at ${timestamp}, price: ${price}`);
  }
}

function updateChart() {
  if (!chart) return;
  
  chart.data.labels = chartData.labels;
  chart.data.datasets[0].data = chartData.equity;
  chart.data.datasets[1].data = chartData.price;
  chart.data.datasets[2].data = chartData.confidence;
  
  chart.update('none'); // 'none' for instant update, 'active' for animation
}

// ============================================
// UI Updates
// ============================================

function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById('connection-status');
  const statusText = statusIndicator.querySelector('.status-text');
  
  if (connected) {
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    statusIndicator.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }
}

function updateMetrics(payload) {
  if (payload.pnl !== undefined) {
    const pnlElement = document.getElementById('current-pnl');
    const pnlValue = payload.pnl;
    pnlElement.textContent = `${pnlValue >= 0 ? '+' : ''}${pnlValue.toFixed(2)}%`;
    pnlElement.className = `info-value pnl ${pnlValue >= 0 ? 'positive' : 'negative'}`;
  }
  
  if (payload.confidence !== undefined) {
    // Could update confidence display if needed
  }
}

function addSignal(type, message) {
  const signalsList = document.getElementById('signals-list');
  const signalCount = document.getElementById('signal-count');
  
  const signalItem = document.createElement('div');
  signalItem.className = `signal-item ${type}`;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  signalItem.innerHTML = `
    <div class="signal-header">
      <span class="signal-type">${type.toUpperCase()}</span>
      <span class="signal-time">${timeStr}</span>
    </div>
    <div class="signal-text">${message}</div>
  `;
  
  signalsList.insertBefore(signalItem, signalsList.firstChild);
  
  // Update count
  const count = signalsList.children.length;
  signalCount.textContent = count;
  
  // Limit to 20 signals
  if (signalsList.children.length > 20) {
    signalsList.removeChild(signalsList.lastChild);
  }
  
  // Auto-scroll
  signalsList.scrollTop = 0;
}

function addChatMessage(author, text) {
  const chatLog = document.getElementById('chat-log');
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${author}`;
  messageDiv.innerHTML = `
    <span class="chat-time">${timeStr}</span>
    <span class="chat-author">${author === 'user' ? 'You' : author === 'ai' ? 'Anton' : 'System'}:</span>
    <span class="chat-text">${text}</span>
  `;
  
  chatLog.appendChild(messageDiv);
  
  // Store in history
  messageHistory.push({ author, text, time: timeStr });
  if (messageHistory.length > MAX_MESSAGES) {
    messageHistory.shift();
  }
  
  // Remove old messages from DOM (keep last MAX_MESSAGES)
  while (chatLog.children.length > MAX_MESSAGES) {
    chatLog.removeChild(chatLog.firstChild);
  }
  
  // Auto-scroll
  chatLog.scrollTop = chatLog.scrollHeight;
}

// ============================================
// Event Handlers
// ============================================

function setupEventHandlers() {
  // Run/Pause buttons
  document.getElementById('run-btn').addEventListener('click', () => {
    isRunning = true;
    document.getElementById('run-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    addChatMessage('system', 'Trading started.');
  });
  
  document.getElementById('pause-btn').addEventListener('click', () => {
    isRunning = false;
    document.getElementById('run-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    addChatMessage('system', 'Trading paused.');
  });
  
  // Strategy selection
  document.querySelectorAll('.strategy-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.strategy-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const strategyName = item.querySelector('.strategy-name').textContent;
      document.getElementById('current-strategy').textContent = strategyName;
      addChatMessage('system', `Strategy changed to: ${strategyName}`);
    });
  });
  
  // Chart controls
  document.getElementById('symbol-select').addEventListener('change', (e) => {
    document.getElementById('current-symbol').textContent = e.target.value;
    addChatMessage('system', `Symbol changed to: ${e.target.value}`);
  });
  
  document.getElementById('timeframe-select').addEventListener('change', (e) => {
    document.getElementById('current-timeframe').textContent = e.target.value + 'm';
    addChatMessage('system', `Timeframe changed to: ${e.target.value}m`);
  });
  
  document.getElementById('strategy-select').addEventListener('change', (e) => {
    const strategyText = e.target.options[e.target.selectedIndex].text;
    document.getElementById('current-strategy').textContent = strategyText;
    addChatMessage('system', `Strategy changed to: ${strategyText}`);
  });
  
  // Signals panel
  document.getElementById('close-signals-btn').addEventListener('click', () => {
    document.getElementById('signals-panel').style.display = 'none';
    document.querySelector('.grid-container').style.gridTemplateColumns = '260px 1fr';
  });
  
  document.getElementById('clear-signals-btn').addEventListener('click', () => {
    document.getElementById('signals-list').innerHTML = '';
    document.getElementById('signal-count').textContent = '0';
  });
  
  // AI Chat
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  
  function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    if (!wsAI || wsAI.readyState !== WebSocket.OPEN) {
      addChatMessage('system', 'WebSocket not connected. Please wait...');
      return;
    }
    
    // Add user message to chat
    addChatMessage('user', message);
    
    // Send to WebSocket
    wsAI.send(JSON.stringify({
      type: 'message',
      text: message,
      timestamp: Date.now()
    }));
    
    chatInput.value = '';
  }
  
  sendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    addChatMessage('system', 'Settings panel (coming soon)');
  });
  
  // New strategy button
  document.getElementById('new-strategy-btn').addEventListener('click', () => {
    addChatMessage('system', 'New strategy creation (coming soon)');
  });
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 CryptoBot Pro - Trading Core initializing...');
  
  initializeChart();
  setupEventHandlers();
  connectWebSockets();
  
  // Initial pause state
  document.getElementById('pause-btn').disabled = true;
  
  console.log('✅ Trading Core initialized');
});
