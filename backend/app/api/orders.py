from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.models import Tariff, Payment, Subscription, Coupon
from app.core.payments import PaymentService

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/create")
async def create_order(tariff_id: int = Body(...), user_id: int = Body(...), coupon_code: str = Body(None), db: AsyncSession = Depends(get_db)):
    # 1. Get Tariff
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")

    # 2. Apply Coupon
    final_price = float(tariff.price)
    if coupon_code:
        c_result = await db.execute(select(Coupon).where(Coupon.code == coupon_code))
        coupon = c_result.scalar_one_or_none()
        if coupon and (coupon.usage_limit is None or coupon.used_count < coupon.usage_limit):
            if coupon.discount_type == "percent":
                final_price = final_price * (1 - float(coupon.value) / 100)
            else:
                final_price = max(0.0, final_price - float(coupon.value))
            
            # Increment usage count
            coupon.used_count += 1
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired coupon")

    # 3. Create local payment record
    new_payment = Payment(
        user_id=user_id,
        amount=final_price,
        currency=tariff.currency,
        provider="yookassa",
        status="pending"
    )
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
        await db.commit()
        return {"status": "pending", "payment_url": yoo_payment.confirmation.confirmation_url}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
