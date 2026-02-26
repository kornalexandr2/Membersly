from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.models import Tariff, Payment, Subscription, Coupon, User, Channel, BotConfig
from app.core.payments import PaymentService
from app.core.config import settings
from aiogram import Bot
from app.api.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/subscriptions")
async def list_user_subscriptions(user_id: int = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription).options(selectinload(Subscription.tariff)).where(Subscription.user_id == user_id)
    )
    return result.scalars().all()

@router.post("/subscriptions/{sub_id}/toggle-renew")
async def toggle_auto_renew(sub_id: int, user_id: int = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id)
    )
    sub = result.scalar_one_or_none()
    if not sub: raise HTTPException(status_code=404, detail="Subscription not found")
    sub.auto_renew = not sub.auto_renew
    await db.commit()
    return {"auto_renew": sub.auto_renew}

@router.get("/access-link/{sub_id}")
async def get_access_link(sub_id: int, user_id: int = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # 1. Verify subscription
    res = await db.execute(
        select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id, Subscription.is_active == True)
    )
    sub = res.scalar_one_or_none()
    if not sub: raise HTTPException(status_code=403, detail="No active subscription")

    # 2. Get channels for this tariff
    t_res = await db.execute(select(Tariff).options(selectinload(Tariff.channels)).where(Tariff.id == sub.tariff_id))
    tariff = t_res.scalar_one()
    
    if not tariff.channels: raise HTTPException(status_code=404, detail="No channels linked to this tariff")
    
    # 3. Get first channel and its bot
    channel = tariff.channels[0]
    b_res = await db.execute(select(BotConfig).where(BotConfig.is_active == True).limit(1))
    bot_cfg = b_res.scalar_one_or_none()
    
    if not bot_cfg: raise HTTPException(status_code=500, detail="No active bots")

    # 4. Generate Link via Bot API
    try:
        async with Bot(token=bot_cfg.token).context() as bot:
            link = await bot.create_chat_invite_link(chat_id=channel.telegram_chat_id, member_limit=1)
            return {"invite_link": link.invite_link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_order(tariff_id: int = Body(...), coupon_code: str = Body(None), use_balance: bool = Body(False), user_id: int = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # 1. Get Tariff & User
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff: raise HTTPException(status_code=404, detail="Tariff not found")

    u_res = await db.execute(select(User).where(User.telegram_id == user_id))
    user = u_res.scalar_one_or_none()

    # 2. Check for Trial
    existing_sub = await db.execute(select(Subscription).where(Subscription.user_id == user_id, Subscription.tariff_id == tariff_id))
    if tariff.trial_days > 0 and not existing_sub.scalar_one_or_none():
        new_sub = Subscription(
            user_id=user_id, tariff_id=tariff_id,
            end_date=datetime.now() + timedelta(days=tariff.trial_days),
            is_active=True, auto_renew=False
        )
        db.add(new_sub)
        await db.commit()
        return {"status": "succeeded", "message": f"Trial activated for {tariff.trial_days} days"}

    # 3. Apply Coupon
    final_price = float(tariff.price)
    if coupon_code:
        c_res = await db.execute(select(Coupon).where(Coupon.code == coupon_code))
        coupon = c_res.scalar_one_or_none()
        
        is_valid = coupon and (coupon.usage_limit is None or coupon.used_count < coupon.usage_limit)
        if is_valid and coupon.valid_until and coupon.valid_until < datetime.now():
            is_valid = False

        if is_valid:
            if coupon.discount_type == "percent":
                final_price = final_price * (1 - float(coupon.value) / 100)
            else:
                final_price = max(0.0, final_price - float(coupon.value))
            coupon.used_count += 1
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired coupon")

    # 4. Use Ⓜ️ Balance
    if use_balance and user and user.balance > 0:
        available = float(user.balance)
        if available >= final_price:
            user.balance -= Decimal(str(final_price))
            final_price = 0.0
        else:
            final_price -= available
            user.balance = 0

    if final_price <= 0:
        new_sub = Subscription(
            user_id=user_id, tariff_id=tariff_id, 
            end_date=datetime.now() + timedelta(days=tariff.duration_days),
            is_active=True
        )
        db.add(new_sub)
        await db.commit()
        return {"status": "succeeded", "message": "Paid with Ⓜ️"}

    # 5. External Payment
    new_payment = Payment(user_id=user_id, amount=final_price, currency=tariff.currency, provider="yookassa", status="pending")
    db.add(new_payment)
    await db.flush()

    try:
        yoo_payment = await PaymentService.create_yookassa_payment(
            amount=final_price, currency=tariff.currency,
            description=f"Subscription: {tariff.title}",
            return_url="https://t.me/your_bot",
            metadata={"payment_id": new_payment.id, "tariff_id": tariff.id, "user_id": user_id}
        )
        new_payment.provider_payment_id = yoo_payment.id
        await db.commit()
        return {"status": "pending", "payment_url": yoo_payment.confirmation.confirmation_url}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook/yookassa")
async def yookassa_webhook(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    if data.get("event") == "payment.succeeded":
        obj = data.get("object")
        provider_id = obj.get("id")
        metadata = obj.get("metadata", {})
        
        res = await db.execute(select(Payment).where(Payment.provider_payment_id == provider_id))
        payment = res.scalar_one_or_none()
        
        if payment and payment.status == "pending":
            payment.status = "succeeded"
            user_id = int(metadata.get("user_id"))
            tariff_id = int(metadata.get("tariff_id"))
            
            t_res = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
            tariff = t_res.scalar_one()
            
            new_sub = Subscription(
                user_id=user_id, tariff_id=tariff_id,
                end_date=datetime.now() + timedelta(days=tariff.duration_days),
                is_active=True, auto_renew=tariff.is_recurring,
                payment_method_id=obj.get("payment_method", {}).get("id")
            )
            db.add(new_sub)
            
            # Referral logic
            u_res = await db.execute(select(User).where(User.telegram_id == user_id))
            user = u_res.scalar_one_or_none()
            if user and user.referrer_id:
                ref_res = await db.execute(select(User).where(User.telegram_id == user.referrer_id))
                referrer = ref_res.scalar_one_or_none()
                if referrer:
                    bonus = float(payment.amount) * 0.05
                    referrer.balance += Decimal(str(bonus))
                    # Notify referrer via bot
                    try:
                        async with Bot(token=settings.bot_token).context() as bot:
                            await bot.send_message(referrer.telegram_id, f"Ⓜ️ Вам начислено {bonus:.2f} Ⓜ️ за покупку вашего реферала!")
                    except Exception: pass
            
            await db.commit()
    return {"status": "ok"}
