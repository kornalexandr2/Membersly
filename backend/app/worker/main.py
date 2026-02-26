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

from app.core.payments import PaymentService
from decimal import Decimal

async def autorenew_subscriptions(ctx):
    session = ctx['session']
    
    # Находим подписки с auto_renew, которые истекают через 1 час
    soon = datetime.now() + timedelta(hours=1)
    result = await session.execute(
        select(Subscription).where(
            Subscription.is_active == True,
            Subscription.auto_renew == True,
            Subscription.payment_method_id.is_not(None),
            Subscription.end_date <= soon,
            Subscription.end_date > datetime.now()
        )
    )
    subs_to_renew = result.scalars().all()
    
    for sub in subs_to_renew:
        # Получаем тариф
        t_res = await session.execute(select(Tariff).where(Tariff.id == sub.tariff_id))
        tariff = t_res.scalar_one_or_none()
        
        if tariff:
            try:
                # Пытаемся списать деньги по токену
                yoo_payment = await PaymentService.charge_recurring(
                    amount=float(tariff.price),
                    currency=tariff.currency,
                    payment_method_id=sub.payment_method_id,
                    description=f"Auto-renew: {tariff.title}"
                )
                
                if yoo_payment.status == "succeeded":
                    # Продлеваем дату окончания
                    sub.end_date = sub.end_date + timedelta(days=tariff.duration_days)
                    await session.commit()
                    print(f"Success auto-renew for user {sub.user_id}")
            except Exception as e:
                print(f"Failed to auto-renew sub {sub.id}: {e}")

async def handle_expired_subscriptions(ctx):
    session = ctx['session']
    bot = ctx['bot']
    
    # Находим подписки, которые истекли более 24 часов назад
    grace_limit = datetime.now() - timedelta(hours=24)
    result = await session.execute(
        select(Subscription).where(
            Subscription.is_active == True,
            Subscription.end_date <= grace_limit
        )
    )
    expired_subs = result.scalars().all()
    
    for sub in expired_subs:
        # Отзываем доступ только после окончания льготного периода
        sub.is_active = False
        await session.commit()
        
        tariff_result = await session.execute(select(Tariff).where(Tariff.id == sub.tariff_id))
        tariff = tariff_result.scalar_one_or_none()
        
        if tariff:
            for channel in tariff.channels:
                try:
                    if channel.type == "channel":
                        await bot.ban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id)
                        await bot.unban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id)
                    else:
                        from aiogram.types import ChatPermissions
                        await bot.restrict_chat_member(
                            chat_id=channel.telegram_chat_id,
                            user_id=sub.user_id,
                            permissions=ChatPermissions(can_send_messages=False)
                        )
                except Exception as e:
                    print(f"Error kicking user {sub.user_id}: {e}")

    # Уведомление о начале Grace Period (те, кто только что истек)
    just_expired = await session.execute(
        select(Subscription).where(
            Subscription.is_active == True,
            Subscription.end_date <= datetime.now(),
            Subscription.end_date > grace_limit
        )
    )
    for sub in just_expired.scalars().all():
        try:
            await bot.send_message(sub.user_id, "⚠️ Ваша подписка истекла. У вас есть 24 часа (Grace Period) на оплату, прежде чем доступ будет ограничен.")
        except Exception: pass

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
