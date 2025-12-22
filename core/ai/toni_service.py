"""
Toni AI Service - AI Assistant for CryptoBot Pro
Supports multiple backends: stub, OpenAI, and local models
"""

import os
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum

log = logging.getLogger(__name__)


class ToniMode(Enum):
    """Toni AI operation modes"""
    STUB = "stub"
    OPENAI = "openai"
    LOCAL = "local"


@dataclass
class ToniContext:
    """Context information for Toni AI responses"""
    # Backtest results
    last_backtest: Optional[Dict[str, Any]] = None
    # Current strategy info
    current_strategy: Optional[str] = None
    current_symbol: Optional[str] = None
    current_timeframe: Optional[str] = None
    # Trading state
    is_live_mode: bool = False
    # Additional context
    additional_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.additional_data is None:
            self.additional_data = {}


class ToniAIService:
    """
    Toni AI Assistant Service
    Provides intelligent responses about trading strategies, backtests, and market analysis
    """
    
    def __init__(self, mode: str = "stub", api_key: Optional[str] = None):
        """
        Initialize Toni AI Service
        
        Args:
            mode: Operation mode - "stub", "openai", or "local"
            api_key: OpenAI API key (required for "openai" mode)
        """
        self.mode = ToniMode(mode.lower())
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.conversation_history: List[Dict[str, str]] = []
        
        # Validate mode and API key
        if self.mode == ToniMode.OPENAI and not self.api_key:
            log.warning("OpenAI mode requested but no API key provided. Falling back to stub mode.")
            self.mode = ToniMode.STUB
        
        log.info(f"Toni AI Service initialized in {self.mode.value} mode")
    
    async def answer(self, query: str, context: Optional[ToniContext] = None) -> str:
        """
        Generate an answer to user query based on context
        
        Args:
            query: User's question or message
            context: Optional context about current trading state
            
        Returns:
            AI-generated response string
        """
        if context is None:
            context = ToniContext()
        
        try:
            if self.mode == ToniMode.STUB:
                return await self._answer_stub(query, context)
            elif self.mode == ToniMode.OPENAI:
                return await self._answer_openai(query, context)
            elif self.mode == ToniMode.LOCAL:
                return await self._answer_local(query, context)
            else:
                return "Unknown mode. Please check configuration."
        except Exception as e:
            log.error(f"Error generating answer: {e}")
            return f"Sorry, I encountered an error: {str(e)}. Please try again."
    
    async def _answer_stub(self, query: str, context: ToniContext) -> str:
        """Generate response using stub mode (template-based)"""
        query_lower = query.lower()
        
        # Backtest-related queries
        if any(word in query_lower for word in ["backtest", "result", "performance", "pnl", "return"]):
            return self._format_backtest_response(context)
        
        # Strategy-related queries
        if any(word in query_lower for word in ["strategy", "strategies", "which strategy", "best strategy"]):
            return self._format_strategy_response(context)
        
        # Market-related queries
        if any(word in query_lower for word in ["market", "price", "btc", "eth", "trend", "analysis"]):
            return self._format_market_response(context)
        
        # Risk-related queries
        if any(word in query_lower for word in ["risk", "drawdown", "stop loss", "risk management"]):
            return self._format_risk_response(context)
        
        # General greeting
        if any(word in query_lower for word in ["hello", "hi", "hey", "help"]):
            return self._format_greeting_response(context)
        
        # Default response
        return self._format_default_response(query, context)
    
    async def _answer_openai(self, query: str, context: ToniContext) -> str:
        """Generate response using OpenAI API"""
        try:
            import openai
            
            # Build system prompt with context
            system_prompt = self._build_system_prompt(context)
            
            # Build messages
            messages = [
                {"role": "system", "content": system_prompt},
            ]
            
            # Add conversation history (last 5 messages)
            for msg in self.conversation_history[-5:]:
                messages.append(msg)
            
            # Add current query
            messages.append({"role": "user", "content": query})
            
            # Call OpenAI API
            client = openai.OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Using cheaper model
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                timeout=10.0
            )
            
            answer = response.choices[0].message.content.strip()
            
            # Save to conversation history
            self.conversation_history.append({"role": "user", "content": query})
            self.conversation_history.append({"role": "assistant", "content": answer})
            
            return answer
            
        except ImportError:
            log.error("OpenAI library not installed. Install with: pip install openai")
            return await self._answer_stub(query, context)
        except Exception as e:
            log.error(f"OpenAI API error: {e}")
            return f"I'm having trouble connecting to OpenAI. Here's a basic answer: {await self._answer_stub(query, context)}"
    
    async def _answer_local(self, query: str, context: ToniContext) -> str:
        """Generate response using local model (placeholder for future implementation)"""
        log.warning("Local model mode not yet implemented, falling back to stub")
        return await self._answer_stub(query, context)
    
    def _build_system_prompt(self, context: ToniContext) -> str:
        """Build system prompt for OpenAI with context"""
        prompt = """You are Toni, an AI trading assistant for CryptoBot Pro. 
You help users understand trading strategies, analyze backtest results, and provide market insights.

Guidelines:
- Be concise and professional
- Use trading terminology correctly
- Provide actionable insights
- Warn about risks when appropriate
- Format numbers clearly (e.g., 23.5%, $1,234.56)
"""
        
        if context.last_backtest:
            summary = context.last_backtest.get('summary', {})
            prompt += "\nCurrent Backtest Results:\n"
            prompt += f"- Total Return: {summary.get('pnl_%', 0)}%\n"
            prompt += f"- Total Trades: {summary.get('total_trades', 0)}\n"
            prompt += f"- Win Rate: {summary.get('winrate', 0)}%\n"
            prompt += f"- Avg R: {summary.get('avg_R', 0)}\n"
            prompt += f"- Max Drawdown: {summary.get('max_dd', 0)}%\n"
        
        if context.current_strategy:
            prompt += f"\nCurrent Strategy: {context.current_strategy}\n"
        
        if context.current_symbol:
            prompt += f"Current Symbol: {context.current_symbol}\n"
        
        return prompt
    
    def _format_backtest_response(self, context: ToniContext) -> str:
        """Format response about backtest results"""
        if context.last_backtest and context.last_backtest.get('summary'):
            summary = context.last_backtest['summary']
            pnl = summary.get('pnl_%', 0)
            trades = summary.get('total_trades', 0)
            winrate = summary.get('winrate', 0)
            avg_r = summary.get('avg_R', 0)
            max_dd = summary.get('max_dd', 0)
            
            response = "📊 **Backtest Results Summary:**\n\n"
            response += f"• **Total Return:** {pnl:+.2f}%\n"
            response += f"• **Total Trades:** {trades}\n"
            response += f"• **Win Rate:** {winrate:.1f}%\n"
            response += f"• **Average R:** {avg_r:+.2f}R\n"
            response += f"• **Max Drawdown:** {max_dd:.2f}%\n\n"
            
            if pnl > 0:
                response += "✅ The strategy shows positive returns. "
            else:
                response += "⚠️ The strategy shows negative returns. "
            
            if winrate > 50:
                response += f"Win rate of {winrate:.1f}% is above average. "
            else:
                response += f"Win rate of {winrate:.1f}% needs improvement. "
            
            if max_dd > 20:
                response += f"⚠️ High drawdown ({max_dd:.2f}%) indicates elevated risk."
            else:
                response += f"Drawdown of {max_dd:.2f}% is within acceptable limits."
            
            return response
        else:
            return "No backtest results available. Run a backtest first to see performance metrics."
    
    def _format_strategy_response(self, context: ToniContext) -> str:
        """Format response about strategies"""
        strategy = context.current_strategy or "No strategy selected"
        response = f"📋 **Current Strategy:** {strategy}\n\n"
        
        if strategy == "pattern3_extreme":
            response += "This strategy detects three-candle swing patterns with extremum detection. "
            response += "It looks for swing-lows followed by bearish pierce and bullish engulfing reversal candles."
        elif strategy == "momentum_ml_v2":
            response += "This is a momentum-based strategy using RSI and moving averages. "
            response += "It identifies oversold conditions in uptrends with volume confirmation."
        else:
            response += "Select a strategy to get specific information about its logic and parameters."
        
        return response
    
    def _format_market_response(self, context: ToniContext) -> str:
        """Format response about market conditions"""
        symbol = context.current_symbol or "BTCUSDT"
        response = f"📈 **Market Analysis for {symbol}:**\n\n"
        response += "For detailed market analysis, I recommend:\n"
        response += "• Running a backtest to see historical performance\n"
        response += "• Checking current price action and indicators\n"
        response += "• Reviewing risk parameters before trading\n\n"
        response += "Would you like me to analyze a specific aspect of the market?"
        return response
    
    def _format_risk_response(self, context: ToniContext) -> str:
        """Format response about risk management"""
        response = "⚠️ **Risk Management Guidelines:**\n\n"
        response += "• Always use stop losses (recommended: 2-5%)\n"
        response += "• Risk no more than 1-2% of capital per trade\n"
        response += "• Monitor maximum drawdown (keep below 20%)\n"
        response += "• Use proper position sizing based on risk/reward ratio\n"
        response += "• Never risk more than you can afford to lose\n\n"
        response += "Current risk settings can be adjusted in the Risk Settings panel."
        return response
    
    def _format_greeting_response(self, context: ToniContext) -> str:
        """Format greeting response"""
        response = "👋 Hello! I'm **Toni**, your AI trading assistant.\n\n"
        response += "I can help you with:\n"
        response += "• 📊 Analyzing backtest results\n"
        response += "• 📈 Explaining trading strategies\n"
        response += "• 💹 Market analysis and insights\n"
        response += "• ⚠️ Risk management advice\n\n"
        response += "What would you like to know?"
        return response
    
    def _format_default_response(self, query: str, context: ToniContext) -> str:
        """Format default response for unrecognized queries"""
        response = "I understand you're asking about: " + query + "\n\n"
        response += "I can help with:\n"
        response += "• Backtest analysis and performance metrics\n"
        response += "• Strategy explanations and recommendations\n"
        response += "• Market analysis and trends\n"
        response += "• Risk management guidance\n\n"
        response += "Could you rephrase your question or ask about one of these topics?"
        return response
    
    def update_context(self, context: ToniContext):
        """Update the service context (for caching)"""
        self._cached_context = context
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []

