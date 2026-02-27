import asyncio
import logging
from aiogram import Bot, Dispatcher
from app.core.config import settings
from app.bot.handlers.start import router as start_router
from app.bot.middlewares.i18n import I18nMiddleware
import os

logging.basicConfig(level=logging.INFO)

from app.models.models import BotConfig
from app.core.db import AsyncSessionLocal
from sqlalchemy import select

async def main():
    dp = Dispatcher()
    
    # Locales path
    locales_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "locales")
    dp.message.middleware(I18nMiddleware(locales_dir))
    dp.callback_query.middleware(I18nMiddleware(locales_dir))
    dp.include_router(start_router)

    # Fetch active bots from DB
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(BotConfig).where(BotConfig.is_active == True))
        bot_configs = result.scalars().all()

    bots = []
    added_tokens = set()
    
    # Add default bot from env if present
    if settings.bot_token and settings.bot_token != "PLACEHOLDER_TOKEN":
        bots.append(Bot(token=settings.bot_token))
        added_tokens.add(settings.bot_token)

    # Add bots from DB
    for config in bot_configs:
        if config.token in added_tokens:
            continue
        try:
            bots.append(Bot(token=config.token))
            added_tokens.add(config.token)
        except Exception as e:
            logging.error(f"Failed to init bot with token {config.token[:10]}...: {e}")

    if not bots:
        logging.error("No active bots found. Please add a bot token.")
        while True: await asyncio.sleep(3600)

    logging.info(f"Starting {len(bots)} bots...")
    
    # Remove webhooks and start polling for all bots
    await asyncio.gather(*(bot.delete_webhook(drop_pending_updates=True) for bot in bots))
    await dp.start_polling(*bots)

if __name__ == "__main__":
    asyncio.run(main())
