from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import hmac
import hashlib
from urllib.parse import parse_qsl

from app.core.config import settings
from passlib.context import CryptContext
from app.models.base import Base
from app.core.db import get_db, AsyncSessionLocal, engine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Membersly API")

@app.on_event("startup")
async def startup_event():
    # 1. Automatic table creation/validation
    async with engine.begin() as conn:
        # This will create tables if they don't exist.
        # For a "commercial" app, it's the safest way for initial setup.
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # 2. Check if admin exists
        result = await session.execute(select(AdminUser).limit(1))
        admin = result.scalar_one_or_none()
        
        if not admin:
            default_admin = AdminUser(
                login="admin",
                password_hash=pwd_context.hash("admin1234")
            )
            session.add(default_admin)
            await session.commit()
            print("--- DEFAULT ADMIN CREATED ---")
            print("Login: admin")
            print("Password: admin1234")
            print("-----------------------------")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelegramAuth(BaseModel):
    initData: str

def validate_telegram_data(init_data: str, bot_token: str) -> dict:
    # Function to validate initData from Telegram WebApp
    try:
        parsed_data = dict(parse_qsl(init_data, strict_parsing=True))
        if 'hash' not in parsed_data:
            return None
            
        hash_value = parsed_data.pop('hash')
        data_check_string = "
".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash == hash_value:
            import json
            user = json.loads(parsed_data['user'])
            return user
    except Exception:
        pass
    return None

@app.post("/auth/telegram")
async def auth_telegram(data: TelegramAuth):
    user = validate_telegram_data(data.initData, settings.bot_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid auth data")
    return {"status": "ok", "user": user}

@app.get("/tariffs")
async def get_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff))
    tariffs = result.scalars().all()
    return {"tariffs": tariffs}

@app.post("/orders/create")
async def create_order(tariff_id: int = Body(...), user_id: int = Body(...), db: AsyncSession = Depends(get_db)):
    # Placeholder for order creation logic (Yookassa / Telegram Stars)
    return {"status": "pending", "payment_url": "https://example.com/pay"}

# --- Admin Management Endpoints ---

class BotCreate(BaseModel):
    token: str
    title: Optional[str] = None

@app.get("/admin/bots")
async def list_bots(db: AsyncSession = Depends(get_db)):
    from app.models.models import BotConfig
    result = await db.execute(select(BotConfig))
    return result.scalars().all()

@app.post("/admin/bots")
async def add_bot(bot_data: BotCreate, db: AsyncSession = Depends(get_db)):
    from app.models.models import BotConfig
    new_bot = BotConfig(token=bot_data.token, title=bot_data.title)
    db.add(new_bot)
    await db.commit()
    return new_bot

@app.delete("/admin/bots/{bot_id}")
async def delete_bot(bot_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import BotConfig
    result = await db.execute(select(BotConfig).where(BotConfig.id == bot_id))
    bot = result.scalar_one_or_none()
    if bot:
        await db.delete(bot)
        await db.commit()
    return {"status": "deleted"}

@app.get("/admin/channels")
async def list_channels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Channel))
    return result.scalars().all()

@app.post("/admin/channels")
async def add_channel(chat_id: int, title: str, type: str, db: AsyncSession = Depends(get_db)):
    new_channel = Channel(telegram_chat_id=chat_id, title=title, type=type)
    db.add(new_channel)
    await db.commit()
    return new_channel
