from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.models import Tariff

from app.core.config import settings
from aiogram import Bot

router = APIRouter(tags=["public"])

from app.models.models import Tariff, User

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.telegram_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        # Create user if not exists (fallback for direct web access)
        user = User(telegram_id=user_id, full_name="User")
        db.add(user)
        await db.commit()
    return user

@router.get("/config")
async def get_config():
    # Fetch bot username to build referral links
    bot_username = "bot"
    if settings.bot_token and settings.bot_token != "PLACEHOLDER_TOKEN":
        try:
            async with Bot(token=settings.bot_token).context() as bot:
                me = await bot.get_me()
                bot_username = me.username
        except Exception:
            pass
    return {"bot_username": bot_username}

@router.get("/tariffs")
async def get_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff))
    return result.scalars().all()
