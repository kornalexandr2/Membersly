from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from aiogram import Bot

from app.core.db import get_db
from app.models.models import BotConfig, Channel, User, Tariff

router = APIRouter(prefix="/admin", tags=["admin"])

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

@router.get("/tariffs")
async def list_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff))
    return result.scalars().all()

@router.post("/tariffs")
async def add_tariff(tariff_data: TariffCreate, db: AsyncSession = Depends(get_db)):
    new_tariff = Tariff(
        title=tariff_data.title,
        price=tariff_data.price,
        currency=tariff_data.currency,
        duration_days=tariff_data.duration_days,
        is_recurring=tariff_data.is_recurring
    )
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
