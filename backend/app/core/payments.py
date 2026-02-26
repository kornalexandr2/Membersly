import uuid
from yookassa import Configuration, Payment as YooPayment
from app.core.config import settings

Configuration.account_id = settings.yookassa_shop_id
Configuration.secret_key = settings.yookassa_secret_key

class PaymentService:
    @staticmethod
    async def create_yookassa_payment(amount: float, currency: str, description: str, return_url: str, metadata: dict):
        payment = YooPayment.create({
            "amount": {
                "value": str(amount),
                "currency": currency
            },
            "confirmation": {
                "type": "redirect",
                "return_url": return_url
            },
            "capture": True,
            "description": description,
            "metadata": metadata,
            "save_payment_method": True # For future recurring payments
        }, uuid.uuid4())
        
        return payment

    @staticmethod
    async def get_yookassa_payment_status(payment_id: str):
        payment = YooPayment.find_one(payment_id)
        return payment.status, payment.payment_method.id if payment.payment_method else None

    @staticmethod
    async def charge_recurring(amount: float, currency: str, payment_method_id: str, description: str):
        # Implementation of payment without user interaction
        payment = YooPayment.create({
            "amount": {
                "value": str(amount),
                "currency": currency
            },
            "capture": True,
            "payment_method_id": payment_method_id,
            "description": f"Recurring: {description}"
        }, uuid.uuid4())
        return payment
