from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Any
from pydantic import BaseModel
from aiogram import Bot
from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.models import BotConfig, Channel, User, Tariff
from app.api.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from app.models.models import Subscription, Payment, User
    active_subs = await db.execute(select(func.count(Subscription.id)).where(Subscription.is_active == True))
    total_rev = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "succeeded"))
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users = await db.execute(select(func.count(User.telegram_id)).where(User.created_at >= today))
    month_ago = datetime.now() - timedelta(days=30)
    monthly_rev = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "succeeded", Payment.created_at >= month_ago))
    return {
        "active_subscriptions": active_subs.scalar() or 0,
        "total_revenue": float(total_rev.scalar() or 0),
        "new_users_today": new_users.scalar() or 0,
        "monthly_revenue": float(monthly_rev.scalar() or 0)
    }

class BotCreate(BaseModel):
    token: str
    title: Optional[str] = None

@router.post("/settings/tg-id")
async def update_admin_tg_id(tg_id: int = Body(...), current_admin: str = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    from app.models.models import AdminUser
    result = await db.execute(select(AdminUser).where(AdminUser.login == current_admin))
    admin = result.scalar_one()
    admin.telegram_id = tg_id
    await db.commit()
    return {"status": "ok"}

@router.get("/bots")
async def list_bots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotConfig))
    return result.scalars().all()

@router.post("/bots")
async def add_bot(bot_data: BotCreate, db: AsyncSession = Depends(get_db)):
    new_bot = BotConfig(token=bot_data.token, title=bot_data.title)
    db.add(new_bot)
    await db.commit()
    return new_bot

@router.patch("/bots/{bot_id}")
async def update_bot(bot_id: int, title: Optional[str] = Body(None), is_active: Optional[bool] = Body(None), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.id == bot_id))
    bot = res.scalar_one_or_none()
    if bot:
        if title is not None: bot.title = title
        if is_active is not None: bot.is_active = is_active
        await db.commit()
    return bot

@router.delete("/admin/bots/{bot_id}") # Fix prefix if needed, but router has it
@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(BotConfig).where(BotConfig.id == bot_id))
    bot = res.scalar_one_or_none()
    if bot:
        await db.delete(bot)
        await db.commit()
    return {"status": "deleted"}

@router.get("/channels")
async def list_channels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Channel))
    return result.scalars().all()

@router.post("/channels")
async def add_channel(chat_id: int = Body(...), title: str = Body(...), type: str = Body(...), welcome_text: Optional[str] = Body(None), pin_welcome: Optional[bool] = Body(False), db: AsyncSession = Depends(get_db)):
    new_channel = Channel(telegram_chat_id=chat_id, title=title, type=type, welcome_text=welcome_text, pin_welcome=pin_welcome)
    db.add(new_channel)
    await db.commit()
    return new_channel

@router.patch("/channels/{channel_id}")
async def update_channel(channel_id: int, title: Optional[str] = Body(None), welcome_text: Optional[str] = Body(None), pin_welcome: Optional[bool] = Body(None), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = res.scalar_one_or_none()
    if channel:
        if title is not None: channel.title = title
        if welcome_text is not None: channel.welcome_text = welcome_text
        if pin_welcome is not None: channel.pin_welcome = pin_welcome
        await db.commit()
    return channel

@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = res.scalar_one_or_none()
    if channel:
        await db.delete(channel)
        await db.commit()
    return {"status": "deleted"}

class TariffCreate(BaseModel):
    title: str
    price: float
    currency: str
    duration_days: int
    is_recurring: bool = False
    trial_days: int = 0
    access_level: str = "full_access"
    channel_ids: List[int] = []

@router.get("/tariffs")
async def list_tariffs(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Tariff).options(selectinload(Tariff.channels)))
    return result.scalars().all()

@router.post("/tariffs")
async def add_tariff(tariff_data: TariffCreate, db: AsyncSession = Depends(get_db)):
    new_tariff = Tariff(title=tariff_data.title, price=tariff_data.price, currency=tariff_data.currency, duration_days=tariff_data.duration_days, is_recurring=tariff_data.is_recurring, trial_days=tariff_data.trial_days, access_level=tariff_data.access_level)
    if tariff_data.channel_ids:
        res = await db.execute(select(Channel).where(Channel.id.in_(tariff_data.channel_ids)))
        new_tariff.channels = res.scalars().all()
    db.add(new_tariff)
    await db.commit()
    return new_tariff

@router.patch("/tariffs/{tariff_id}")
async def update_tariff(tariff_id: int, title: Optional[str] = Body(None), price: Optional[float] = Body(None), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = res.scalar_one_or_none()
    if tariff:
        if title is not None: tariff.title = title
        if price is not None: tariff.price = price
        await db.commit()
    return tariff

@router.delete("/tariffs/{tariff_id}")
async def delete_tariff(tariff_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = res.scalar_one_or_none()
    if tariff:
        await db.delete(tariff)
        await db.commit()
    return {"status": "deleted"}

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/users/{user_id}/balance")
async def update_user_balance(user_id: int, amount: float = Body(...), db: AsyncSession = Depends(get_db)):
    from decimal import Decimal
    res = await db.execute(select(User).where(User.telegram_id == user_id))
    user = res.scalar_one_or_none()
    if user:
        user.balance = Decimal(str(amount))
        await db.commit()
    return user

@router.post("/users/{user_id}/extend")
async def extend_user_subscription(user_id: int, tariff_id: int = Body(...), days: int = Body(...), db: AsyncSession = Depends(get_db)):
    from app.models.models import Subscription
    res = await db.execute(select(Subscription).where(Subscription.user_id == user_id, Subscription.tariff_id == tariff_id, Subscription.is_active == True))
    sub = res.scalar_one_or_none()
    if sub: sub.end_date += timedelta(days=days)
    else:
        sub = Subscription(user_id=user_id, tariff_id=tariff_id, start_date=datetime.now(), end_date=datetime.now() + timedelta(days=days), is_active=True)
        db.add(sub)
    await db.commit()
    return {"status": "ok", "new_end_date": sub.end_date}

@router.get("/payments")
async def list_payments(db: AsyncSession = Depends(get_db)):
    from app.models.models import Payment
    result = await db.execute(select(Payment).order_by(Payment.created_at.desc()).limit(100))
    return result.scalars().all()

@router.get("/subscriptions")
async def list_subscriptions(db: AsyncSession = Depends(get_db)):
    from app.models.models import Subscription
    result = await db.execute(select(Subscription).order_by(Subscription.end_date.desc()).limit(100))
    return result.scalars().all()

@router.delete("/subscriptions/{sub_id}")
async def revoke_subscription(sub_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Subscription
    res = await db.execute(select(Subscription).where(Subscription.id == sub_id))
    sub = res.scalar_one_or_none()
    if sub: sub.is_active = False; await db.commit()
    return {"status": "revoked"}

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    value: float
    usage_limit: Optional[int] = 1

@router.get("/coupons")
async def list_coupons(db: AsyncSession = Depends(get_db)):
    from app.models.models import Coupon
    result = await db.execute(select(Coupon))
    return result.scalars().all()

@router.post("/coupons")
async def add_coupon(data: CouponCreate, db: AsyncSession = Depends(get_db)):
    from app.models.models import Coupon
    new_c = Coupon(code=data.code, discount_type=data.discount_type, value=data.value, usage_limit=data.usage_limit)
    db.add(new_c); await db.commit(); return new_c

@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Coupon
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    c = res.scalar_one_or_none()
    if c: await db.delete(c); await db.commit()
    return {"status": "deleted"}

@router.post("/broadcast")
async def admin_broadcast(text: str = Body(...), segment: str = Body("all"), db: AsyncSession = Depends(get_db)):
    from app.models.models import BotConfig, User, Subscription
    from sqlalchemy import and_
    
    # 1. Фильтруем пользователей по сегменту
    if segment == "active":
        # Пользователи с хотя бы одной активной подпиской
        query = select(User).join(Subscription).where(Subscription.is_active == True).distinct()
    elif segment == "expired":
        # Пользователи, у которых были подписки, но сейчас нет ни одной активной
        query = select(User).join(Subscription).where(Subscription.is_active == False).distinct()
    else:
        query = select(User)
        
    users_res = await db.execute(query)
    users = users_res.scalars().all()
    
    # 2. Получаем бота для отправки
    bots_res = await db.execute(select(BotConfig).where(BotConfig.is_active == True))
    bots = bots_res.scalars().all()
    
    count = 0
    if bots and users:
        bot = Bot(token=bots[0].token)
        for u in users:
            try:
                await bot.send_message(u.telegram_id, text)
                count += 1
            except Exception: continue
        await bot.session.close()
        
    return {"status": "ok", "sent_to": count}
