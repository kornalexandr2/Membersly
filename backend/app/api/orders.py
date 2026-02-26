from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.models import Tariff, Payment, Subscription, Coupon
from app.core.payments import PaymentService

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/subscriptions/{user_id}")
async def list_user_subscriptions(user_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Subscription).options(selectinload(Subscription.tariff)).where(Subscription.user_id == user_id)
    )
    return result.scalars().all()

@router.post("/subscriptions/{sub_id}/toggle-renew")
async def toggle_auto_renew(sub_id: int, user_id: int = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subscription).where(Subscription.id == sub_id, Subscription.user_id == user_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    sub.auto_renew = not sub.auto_renew
    await db.commit()
    return {"auto_renew": sub.auto_renew}

@router.post("/create")
async def create_order(tariff_id: int = Body(...), user_id: int = Body(...), coupon_code: str = Body(None), use_balance: bool = Body(False), db: AsyncSession = Depends(get_db)):
    from app.models.models import User
    # 1. Get Tariff & User
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff: raise HTTPException(status_code=404, detail="Tariff not found")

    user_result = await db.execute(select(User).where(User.telegram_id == user_id))
    user = user_result.scalar_one_or_none()

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
    # ... (coupon logic remains same)
    
    # 3. Use Internal Currency Ⓜ️
    paid_with_balance = 0.0
    if use_balance and user and user.balance > 0:
        available = float(user.balance)
        if available >= final_price:
            paid_with_balance = final_price
            final_price = 0.0
            user.balance -= Decimal(str(paid_with_balance))
        else:
            paid_with_balance = available
            final_price -= available
            user.balance = 0
            
    # 4. Handle Full Payment via Ⓜ️
    if final_price == 0:
        # Create subscription immediately
        from datetime import datetime, timedelta
        new_sub = Subscription(
            user_id=user_id, tariff_id=tariff_id, 
            end_date=datetime.now() + timedelta(days=tariff.duration_days),
            is_active=True
        )
        db.add(new_sub)
        await db.commit()
        return {"status": "succeeded", "message": "Paid with Ⓜ️"}

    # 5. Create Yookassa Payment for remaining amount
    new_payment = Payment(
        user_id=user_id, amount=final_price, currency=tariff.currency,
        provider="yookassa", status="pending"
    )
    # ...
    db.add(new_payment)
    await db.flush()

    try:
        yoo_payment = await PaymentService.create_yookassa_payment(
            amount=final_price,
            currency=tariff.currency,
            description=f"Subscription: {tariff.title} (Coupon: {coupon_code or 'None'})",
            return_url="https://t.me/your_bot",
            metadata={"payment_id": new_payment.id, "tariff_id": tariff.id, "user_id": user_id}
        )
        new_payment.provider_payment_id = yoo_payment.id
                    from app.models.models import User
                    from decimal import Decimal
                    
                    # Referral logic
                    result_u = await db.execute(select(User).where(User.telegram_id == user_id))
                    user = result_u.scalar_one_or_none()
                    if user and user.referrer_id:
                        ref_result = await db.execute(select(User).where(User.telegram_id == user.referrer_id))
                        referrer = ref_result.scalar_one_or_none()
                        if referrer:
                            bonus = float(payment.amount) * 0.05
                            referrer.balance += Decimal(str(bonus))
                    
                    await db.commit()
        
        return {"status": "pending", "payment_url": yoo_payment.confirmation.confirmation_url}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
