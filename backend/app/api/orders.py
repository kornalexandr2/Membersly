from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.models import Tariff, Payment, Subscription
from app.core.payments import PaymentService

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/create")
async def create_order(tariff_id: int = Body(...), user_id: int = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")

    new_payment = Payment(user_id=user_id, amount=tariff.price, currency=tariff.currency, provider="yookassa", status="pending")
    db.add(new_payment)
    await db.flush()

    try:
        yoo_payment = await PaymentService.create_yookassa_payment(
            amount=float(tariff.price),
            currency=tariff.currency,
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
