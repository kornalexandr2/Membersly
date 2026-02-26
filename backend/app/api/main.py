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

import jwt

SECRET_KEY = "super-secret-key-change-me"
ALGORITHM = "HS256"

class AdminLogin(BaseModel):
    login: str
    password: str

@app.post("/auth/admin")
async def admin_login(data: AdminLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.login == data.login))
    admin = result.scalar_one_or_none()
    
    if not admin or not pwd_context.verify(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({"sub": admin.login, "exp": datetime.utcnow() + timedelta(days=1)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

@app.post("/admin/broadcast")
async def admin_broadcast(text: str = Body(...), db: AsyncSession = Depends(get_db)):
    from app.models.models import BotConfig, User
    from aiogram import Bot
    
    # Get all active bots
    bots_result = await db.execute(select(BotConfig).where(BotConfig.is_active == True))
    bots = bots_result.scalars().all()
    
    # Get all users
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()
    
    count = 0
    if bots:
        # Use the first active bot for broadcast
        bot = Bot(token=bots[0].token)
        for user in users:
            try:
                await bot.send_message(user.telegram_id, text)
                count += 1
            except Exception:
                continue
        await bot.session.close()
        
    return {"status": "ok", "sent_to": count}

@app.get("/tariffs")
async def get_tariffs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff))
    tariffs = result.scalars().all()
    return {"tariffs": tariffs}

from app.core.payments import PaymentService
from app.models.models import Tariff, User, Channel, AdminUser, Payment, Subscription
from datetime import datetime, timedelta

@app.post("/orders/create")
async def create_order(tariff_id: int = Body(...), user_id: int = Body(...), db: AsyncSession = Depends(get_db)):
    # 1. Get Tariff
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")

    # 2. Create local payment record
    new_payment = Payment(
        user_id=user_id,
        amount=tariff.price,
        currency=tariff.currency,
        provider="yookassa",
        status="pending"
    )
    db.add(new_payment)
    await db.flush() # Get ID

    # 3. Create Yookassa Payment
    try:
        yoo_payment = await PaymentService.create_yookassa_payment(
            amount=float(tariff.price),
            currency=tariff.currency,
            description=f"Subscription: {tariff.title}",
            return_url="https://t.me/your_bot", # Or your webapp URL
            metadata={"payment_id": new_payment.id, "tariff_id": tariff.id, "user_id": user_id}
        )
        
        new_payment.provider_payment_id = yoo_payment.id
        await db.commit()
        
        return {"status": "pending", "payment_url": yoo_payment.confirmation.confirmation_url}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment provider error: {str(e)}")

@app.post("/payments/webhook/yookassa")
async def yookassa_webhook(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    # Simple check for successful payment
    if data.get("event") == "payment.succeeded":
        obj = data.get("object")
        provider_id = obj.get("id")
        metadata = obj.get("metadata", {})
        
        result = await db.execute(select(Payment).where(Payment.provider_payment_id == provider_id))
        payment = result.scalar_one_or_none()
        
        if payment and payment.status == "pending":
            payment.status = "succeeded"
            
            # Create or Extend Subscription
            tariff_id = int(metadata.get("tariff_id"))
            user_id = int(metadata.get("user_id"))
            
            tariff_result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
            tariff = tariff_result.scalar_one()
            
            end_date = datetime.now() + timedelta(days=tariff.duration_days)
            
            new_sub = Subscription(
                user_id=user_id,
                tariff_id=tariff_id,
                end_date=end_date,
                is_active=True,
                auto_renew=tariff.is_recurring,
                payment_method_id=obj.get("payment_method", {}).get("id") # Save for recurring
            )
            db.add(new_sub)
            await db.commit()
            
    return {"status": "ok"}

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
