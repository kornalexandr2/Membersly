from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from aiogram import Bot

from app.core.db import get_db
from app.models.models import BotConfig, Channel, User, Tariff

from app.api.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from app.models.models import Subscription, Payment, User
    
    # Считаем активные подписки
    active_subs = await db.execute(select(func.count(Subscription.id)).where(Subscription.is_active == True))
    
    # Считаем общую выручку
    total_rev = await db.execute(select(func.sum(Payment.amount)).where(Payment.status == "succeeded"))
    
    # Новые пользователи за сегодня
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users = await db.execute(select(func.count(User.telegram_id)).where(User.created_at >= today))
    
    # Выручка за последние 30 дней
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

class TariffCreate(BaseModel):
    title: str
    price: float
    currency: str
    duration_days: int
    is_recurring: bool = False
    trial_days: int = 0
    channel_ids: List[int] = []

@router.get("/tariffs")
async def list_tariffs(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Tariff).options(selectinload(Tariff.channels)))
    return result.scalars().all()

@router.post("/tariffs")
async def add_tariff(tariff_data: TariffCreate, db: AsyncSession = Depends(get_db)):
    new_tariff = Tariff(
        title=tariff_data.title,
        price=tariff_data.price,
        currency=tariff_data.currency,
        duration_days=tariff_data.duration_days,
        is_recurring=tariff_data.is_recurring,
        trial_days=tariff_data.trial_days
    )
    
    if tariff_data.channel_ids:
        res = await db.execute(select(Channel).where(Channel.id.in_(tariff_data.channel_ids)))
        channels = res.scalars().all()
        new_tariff.channels = channels

    db.add(new_tariff)
    await db.commit()
    return new_tariff

@router.delete("/tariffs/{tariff_id}")
async def delete_tariff(tariff_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if tariff:
        await db.delete(tariff)
        await db.commit()
    return {"status": "deleted"}

class CouponCreate(BaseModel):
    code: str
    discount_type: str # percent / fixed
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
    new_coupon = Coupon(
        code=data.code,
        discount_type=data.discount_type,
        value=data.value,
        usage_limit=data.usage_limit
    )
    db.add(new_coupon)
    await db.commit()
    return new_coupon

@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import Coupon
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if coupon:
        await db.delete(coupon)
        await db.commit()
    return {"status": "deleted"}

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/users/{user_id}/balance")
async def update_user_balance(user_id: int, amount: float = Body(...), db: AsyncSession = Depends(get_db)):
    from decimal import Decimal
    result = await db.execute(select(User).where(User.telegram_id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.balance = Decimal(str(amount))
        await db.commit()
    return user

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

@router.post("/users/{user_id}/extend")
async def extend_user_subscription(user_id: int, tariff_id: int = Body(...), days: int = Body(...), db: AsyncSession = Depends(get_db)):
    from app.models.models import Subscription
    from datetime import datetime, timedelta
    
    # Check if there is an active sub
    res = await db.execute(select(Subscription).where(Subscription.user_id == user_id, Subscription.tariff_id == tariff_id, Subscription.is_active == True))
    sub = res.scalar_one_or_none()
    
    if sub:
        sub.end_date += timedelta(days=days)
    else:
        sub = Subscription(
            user_id=user_id, tariff_id=tariff_id,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=days),
            is_active=True
        )
        db.add(sub)
    
    await db.commit()
    return {"status": "ok", "new_end_date": sub.end_date}

@router.get("/channels")
async def list_channels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Channel))
    return result.scalars().all()

@router.post("/broadcast")
async def admin_broadcast(text: str = Body(...), db: AsyncSession = Depends(get_db)):
    bots_result = await db.execute(select(BotConfig).where(BotConfig.is_active == True))
    bots = bots_result.scalars().all()
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()
    
    count = 0
    if bots:
        bot = Bot(token=bots[0].token)
        for user in users:
            try:
                await bot.send_message(user.telegram_id, text)
                count += 1
            except Exception: continue
        await bot.session.close()
    return {"status": "ok", "sent_to": count}
