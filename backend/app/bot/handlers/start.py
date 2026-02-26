from aiogram import Router, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import User
from app.core.db import AsyncSessionLocal

router = Router()

@router.message(CommandStart())
async def start_handler(message: types.Message, i18n: callable):
    # Register user
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = result.scalar_one_or_none()
        
        if not user:
            # Extract ref if present
            args = message.text.split()[1:] if len(message.text.split()) > 1 else []
            referrer_id = None
            if args and args[0].startswith('ref_'):
                try:
                    referrer_id = int(args[0].replace('ref_', ''))
                except ValueError:
                    pass
                    
            user = User(
                telegram_id=message.from_user.id,
                username=message.from_user.username,
                full_name=message.from_user.full_name,
                language_code=message.from_user.language_code or 'en',
                referrer_id=referrer_id
            )
            session.add(user)
            await session.commit()

    builder = InlineKeyboardBuilder()
    builder.button(text=i18n("btn_web_app"), web_app=types.WebAppInfo(url="https://example.com/"))
    builder.button(text=i18n("btn_my_subscriptions"), callback_data="my_subs")
    builder.button(text=i18n("btn_support"), url="https://t.me/support")
    builder.adjust(1)

    await message.answer(i18n("welcome_message", name=message.from_user.first_name), reply_markup=builder.as_markup())

@router.chat_join_request()
async def join_request_handler(chat_join: types.ChatJoinRequest):
    # Here you would check if the user has an active subscription for the channel
    # if has_subscription: await chat_join.approve() else: await chat_join.decline()
    # Placeholder: decline by default to prevent unauthorized access
    # await chat_join.decline()
    pass
