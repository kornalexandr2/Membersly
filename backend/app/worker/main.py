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

from datetime import datetime, timedelta
from sqlalchemy import select, update
from app.models.models import Subscription, User, Tariff, Channel

async def notify_users(ctx):
    session = ctx['session']
    bot = ctx['bot']
    
    # Находим подписки, истекающие через 24 часа
    tomorrow = datetime.now() + timedelta(days=1)
    result = await session.execute(
        select(Subscription).where(
            Subscription.is_active == True,
            Subscription.end_date <= tomorrow,
            Subscription.end_date > datetime.now()
        )
    )
    subs = result.scalars().all()
    
    for sub in subs:
        try:
            await bot.send_message(sub.user_id, "Ваша подписка истекает через 24 часа. Пожалуйста, продлите её.")
        except Exception:
            pass

async def handle_expired_subscriptions(ctx):
    session = ctx['session']
    bot = ctx['bot']
    
    # Находим истекшие подписки
    result = await session.execute(
        select(Subscription).where(
            Subscription.is_active == True,
            Subscription.end_date <= datetime.now()
        )
    )
    expired_subs = result.scalars().all()
    
    for sub in expired_subs:
        # 1. Попытка автопродления (если включено) - здесь вызывалась бы функция оплаты
        if sub.auto_renew and sub.payment_method_id:
            # Логика списания через ЮKassa по токену
            pass 
        
        # 2. Если продление не удалось или выключено — отзываем доступ
        sub.is_active = False
        await session.commit()
        
        # Получаем каналы, связанные с тарифом
        tariff_result = await session.execute(select(Tariff).where(Tariff.id == sub.tariff_id))
        tariff = tariff_result.scalar_one_or_none()
        
        if tariff:
            for channel in tariff.channels:
                try:
                    await bot.ban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id)
                    await bot.unban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id) # unban чтобы мог зайти снова после оплаты
                    await bot.send_message(sub.user_id, f"Срок вашей подписки на {channel.title} истек. Доступ ограничен.")
                except Exception as e:
                    print(f"Error kicking user {sub.user_id}: {e}")

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
