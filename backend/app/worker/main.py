from arq.connections import RedisSettings
from aiogram import Bot
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.db import AsyncSessionLocal
import asyncio

async def startup(ctx):
    ctx['bot'] = Bot(token=settings.bot_token)
    ctx['session'] = AsyncSessionLocal()

async def shutdown(ctx):
    await ctx['bot'].session.close()
    await ctx['session'].close()

async def notify_users(ctx):
    # Logic to notify users 3 days and 24 hours before expiration
    pass

async def autorenew_subscriptions(ctx):
    # Logic to charge recurrent payments via Yookassa
    pass

async def handle_expired_subscriptions(ctx):
    # Kick/Ban logic from channels
    pass

async def daily_watchdog(ctx):
    await notify_users(ctx)
    await autorenew_subscriptions(ctx)
    await handle_expired_subscriptions(ctx)

class WorkerSettings:
    functions = [daily_watchdog]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        # Run every minute
        {'function': daily_watchdog, 'minute': set(range(60))}
    ]
