import asyncio
import logging
from aiogram import Bot, Dispatcher
from app.core.config import settings
from app.bot.handlers.start import router as start_router
from app.bot.middlewares.i18n import I18nMiddleware
import os

logging.basicConfig(level=logging.INFO)

async def main():
    if not settings.bot_token or settings.bot_token == "PLACEHOLDER_TOKEN":
        logging.error("BOT_TOKEN is not set or is a placeholder. Bot will not start.")
        # Keep the process alive if needed, or just return. 
        # In a docker context, it's better to stay alive but idle to see logs.
        while True:
            await asyncio.sleep(3600)
            
    try:
        bot = Bot(token=settings.bot_token)
        dp = Dispatcher()
        
        # Locales path
        locales_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "locales")
        dp.message.middleware(I18nMiddleware(locales_dir))
        dp.callback_query.middleware(I18nMiddleware(locales_dir))

        dp.include_router(start_router)

        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Failed to start bot: {e}")
        while True:
            await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())
