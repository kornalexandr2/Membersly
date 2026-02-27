from arq.connections import RedisSettings
from aiogram import Bot
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.db import AsyncSessionLocal
from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.models import Subscription, User, Tariff, Channel
from app.core.payments import PaymentService
from decimal import Decimal
import asyncio
import json
import os

# 1. Locales Engine
LOCALES = {}
locales_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "locales")
for filename in os.listdir(locales_dir):
    if filename.endswith('.json'):
        lang = filename.split('.')[0]
        with open(os.path.join(locales_dir, filename), 'r', encoding='utf-8') as f:
            LOCALES[lang] = json.load(f)

def _(lang: str, key: str, **kwargs) -> str:
    text = LOCALES.get(lang, LOCALES.get('en', {})).get(key, key)
    for k, v in kwargs.items():
        text = text.replace(f"{{{k}}}", str(v))
    return text

# 2. Worker Lifecycle
async def startup(ctx):
    if settings.bot_token and settings.bot_token != "PLACEHOLDER_TOKEN":
        ctx['bot'] = Bot(token=settings.bot_token)
    else:
        ctx['bot'] = None
    ctx['session'] = AsyncSessionLocal()

async def shutdown(ctx):
    if ctx.get('bot'):
        await ctx['bot'].session.close()
    await ctx['session'].close()

# 3. Tasks
async def notify_users(ctx):
    session = ctx['session']
    bot = ctx.get('bot')
    if not bot:
        return

    # 24h Notifications
    tomorrow = datetime.now() + timedelta(days=1)
    res_24 = await session.execute(select(Subscription, User).join(User).where(Subscription.is_active == True, Subscription.end_date <= tomorrow, Subscription.end_date > datetime.now()))
    for sub, user in res_24.all():
        try: await bot.send_message(sub.user_id, _(user.language_code, "notify_24h"))
        except Exception: pass

    # 3d Notifications
    three_days = datetime.now() + timedelta(days=3)
    res_72 = await session.execute(select(Subscription, User).join(User).where(Subscription.is_active == True, Subscription.end_date <= three_days, Subscription.end_date > three_days - timedelta(minutes=10)))
    for sub, user in res_72.all():
        try: await bot.send_message(sub.user_id, _(user.language_code, "notify_3d"))
        except Exception: pass

async def autorenew_subscriptions(ctx):
    session = ctx['session']
    bot = ctx.get('bot')
    soon = datetime.now() + timedelta(hours=1)
    res = await session.execute(select(Subscription).where(Subscription.is_active == True, Subscription.auto_renew == True, Subscription.payment_method_id.is_not(None), Subscription.end_date <= soon, Subscription.end_date > datetime.now()))

    for sub in res.scalars().all():
        t_res = await session.execute(select(Tariff).where(Tariff.id == sub.tariff_id))
        tariff = t_res.scalar_one_or_none()
        u_res = await session.execute(select(User).where(User.telegram_id == sub.user_id))
        user = u_res.scalar_one_or_none()

        if tariff and user:
            try:
                pay = await PaymentService.charge_recurring(amount=float(tariff.price), currency=tariff.currency, payment_method_id=sub.payment_method_id, description=f"Renew: {tariff.title}")
                if pay and pay.status == "succeeded":
                    sub.end_date = sub.end_date + timedelta(days=tariff.duration_days)
                    await session.commit()
                    # Notify success
                    if bot:
                        try: await bot.send_message(sub.user_id, _(user.language_code, "renew_success", title=tariff.title))
                        except Exception: pass
                else:
                    # Notify failure
                    if bot:
                        try: await bot.send_message(sub.user_id, _(user.language_code, "renew_failed"))
                        except Exception: pass
            except Exception: pass
async def handle_expired_subscriptions(ctx):
    session = ctx['session']
    bot = ctx.get('bot')
    
    grace_limit = datetime.now() - timedelta(hours=24)

    # Final Expire (After Grace)
    res = await session.execute(select(Subscription, User).join(User).where(Subscription.is_active == True, Subscription.end_date <= grace_limit))
    for sub, user in res.all():
        sub.is_active = False
        await session.commit()
        if not bot: continue
        t_res = await session.execute(select(Tariff).where(Tariff.id == sub.tariff_id))
        tariff = t_res.scalar_one_or_none()
        if tariff:
            for channel in tariff.channels:
                try:
                    if channel.type == "channel":
                        await bot.ban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id)
                        await bot.unban_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id)
                    else:
                        from aiogram.types import ChatPermissions
                        await bot.restrict_chat_member(chat_id=channel.telegram_chat_id, user_id=sub.user_id, permissions=ChatPermissions(can_send_messages=False))
                    await bot.send_message(sub.user_id, _(user.language_code, "access_revoked", title=channel.title))
                except Exception: pass

    if bot:
        # Notify Grace Period
        just_expired = await session.execute(select(Subscription, User).join(User).where(Subscription.is_active == True, Subscription.end_date <= datetime.now(), Subscription.end_date > grace_limit))
        for sub, user in just_expired.all():
            try: await bot.send_message(sub.user_id, _(user.language_code, "grace_period_start"))
            except Exception: pass
async def daily_watchdog(ctx):
    await notify_users(ctx)
    await autorenew_subscriptions(ctx)
    await handle_expired_subscriptions(ctx)

from arq.cron import cron

class WorkerSettings:
    functions = [daily_watchdog]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [cron(daily_watchdog, minute=set(range(60)))]
