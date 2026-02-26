from aiogram import Router, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.models.models import User, Subscription, Tariff, Payment
from app.core.db import AsyncSessionLocal

router = Router()

@router.message(CommandStart())
async def start_handler(message: types.Message, i18n: callable):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = result.scalar_one_or_none()
        
        args = message.text.split()[1:] if len(message.text.split()) > 1 else []
        referrer_id = None
        utm_source = None
        start_coupon = None

        if args:
            for arg in args:
                if arg.startswith('ref_'):
                    try: referrer_id = int(arg.replace('ref_', ''))
                    except ValueError: pass
                elif arg.startswith('utm_'):
                    utm_source = arg.replace('utm_', '')
                elif arg.startswith('coupon_'):
                    start_coupon = arg.replace('coupon_', '')

        if not user:
            user = User(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                full_name=message.from_user.full_name,
                language_code=message.from_user.language_code or 'en',
                referrer_id=referrer_id,
                utm_source=utm_source
            )
            session.add(user)
            await session.commit()
            
            if start_coupon:
                await message.answer(i18n("coupon_activated", coupon=start_coupon))

    builder = InlineKeyboardBuilder()
    builder.button(text=i18n("btn_web_app"), web_app=types.WebAppInfo(url="https://example.com/"))
    builder.button(text=i18n("btn_balance"), callback_data="view_balance")
    builder.button(text=i18n("btn_my_subscriptions"), callback_data="my_subs")
    builder.button(text=i18n("btn_support"), url="https://t.me/support")
    builder.adjust(1)

    await message.answer(i18n("welcome_message", name=message.from_user.first_name), reply_markup=builder.as_markup())

@router.callback_query(lambda c: c.data == "view_balance")
async def view_balance_handler(callback: types.CallbackQuery, i18n: callable):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == callback.from_user.id))
        user = result.scalar_one_or_none()
        balance = user.balance if user else 0
        
    await callback.message.answer(i18n("balance_info", id=callback.from_user.id, balance=balance))
    await callback.answer()

@router.callback_query(lambda c: c.data == "my_subs")
async def my_subscriptions_handler(callback: types.CallbackQuery, i18n: callable):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Subscription, Tariff).join(Tariff).where(
                Subscription.user_id == callback.from_user.id,
                Subscription.is_active == True
            )
        )
        subs_data = result.all()

    if not subs_data:
        await callback.message.answer(i18n("no_active_subscriptions"))
    else:
        text = i18n("active_subscriptions_list") + "\n\n"
        for sub, tariff in subs_data:
            end_date = sub.end_date.strftime("%d.%m.%Y")
            text += f"✅ {tariff.title} — до {end_date}\n"
        await callback.message.answer(text)
    await callback.answer()

@router.pre_checkout_query()
async def pre_checkout_query_handler(pre_checkout_query: types.PreCheckoutQuery):
    await pre_checkout_query.answer(ok=True)

@router.message(types.Message.successful_payment)
async def successful_payment_handler(message: types.Message):
    payload = message.successful_payment.invoice_payload
    tariff_id = int(payload)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Tariff).where(Tariff.id == tariff_id))
        tariff = result.scalar_one()
        
        end_date = datetime.now() + timedelta(days=tariff.duration_days)
        new_sub = Subscription(user_id=message.from_user.id, tariff_id=tariff_id, end_date=end_date, is_active=True)
        session.add(new_sub)
        
        new_payment = Payment(
            user_id=message.from_user.id,
            amount=tariff.price,
            currency="XTR",
            provider="telegram_stars",
            provider_payment_id=message.successful_payment.telegram_payment_charge_id,
            status="succeeded"
        )
        session.add(new_payment)
        await session.commit()

    await message.answer("Оплата в Stars прошла успешно! Доступ открыт.")

@router.chat_join_request()
async def join_request_handler(chat_join: types.ChatJoinRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Subscription).where(
                Subscription.user_id == chat_join.from_user.id,
                Subscription.is_active == True,
                Subscription.end_date > datetime.now()
            )
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            await chat_join.approve()
            await chat_join.bot.send_message(chat_join.from_user.id, "Ваша заявка одобрена! Добро пожаловать.")
        else:
            await chat_join.decline()
            await chat_join.bot.send_message(chat_join.from_user.id, "Для вступления необходимо оформить подписку.")
