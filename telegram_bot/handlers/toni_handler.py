"""
Telegram bot handler for Toni AI assistant
"""

import logging
from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command
from core.ai.toni_service import ToniAIService, ToniContext

log = logging.getLogger(__name__)

# Initialize Toni service
toni_mode = "stub"  # Can be overridden from config
toni_service = ToniAIService(mode=toni_mode)

router = Router()


@router.message(Command("ask"))
async def cmd_ask(message: Message):
    """Handle /ask command - ask Toni AI a question"""
    # Extract question from command
    question = message.text.replace("/ask", "").strip()
    
    if not question:
        await message.reply(
            "❓ Please provide a question after /ask command.\n\n"
            "Example: /ask What is the current strategy performance?"
        )
        return
    
    try:
        # Build context (can be extended with actual trading state)
        context = ToniContext(
            current_strategy=None,  # Can be retrieved from user state
            current_symbol=None,
            current_timeframe=None,
            is_live_mode=False
        )
        
        # Get answer from Toni
        answer = await toni_service.answer(question, context)
        
        # Send response
        await message.reply(f"🤖 **Toni AI:**\n\n{answer}", parse_mode="Markdown")
        
    except Exception as e:
        log.error(f"Error in /ask command: {e}")
        await message.reply(
            "❌ Sorry, I encountered an error processing your question. "
            "Please try again later."
        )


@router.message(F.text.startswith("?"))
async def handle_question_shortcut(message: Message):
    """Handle question shortcut - messages starting with ?"""
    question = message.text[1:].strip()
    
    if not question:
        return
    
    try:
        context = ToniContext()
        answer = await toni_service.answer(question, context)
        await message.reply(f"🤖 **Toni AI:**\n\n{answer}", parse_mode="Markdown")
    except Exception as e:
        log.error(f"Error in question shortcut: {e}")
        await message.reply("❌ Error processing question. Please try again.")

