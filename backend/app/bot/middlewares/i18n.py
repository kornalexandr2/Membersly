import json
import os
from typing import Any, Awaitable, Callable, Dict
from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery, TelegramObject

class I18nMiddleware(BaseMiddleware):
    def __init__(self, locales_dir: str):
        self.locales = {}
        for filename in os.listdir(locales_dir):
            if filename.endswith('.json'):
                lang = filename.split('.')[0]
                with open(os.path.join(locales_dir, filename), 'r', encoding='utf-8') as f:
                    self.locales[lang] = json.load(f)

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        
        user = data.get("event_from_user")
        
        # Here we should fetch user language from DB. For now, we fallback to telegram language code
        # A full implementation would check the DB user object in `data['user']`
        lang = user.language_code if user and user.language_code in self.locales else 'en'
        if not lang in self.locales:
            lang = 'en'
            
        def _(key: str, **kwargs) -> str:
            text = self.locales[lang].get(key, key)
            for k, v in kwargs.items():
                text = text.replace(f"{{{k}}}", str(v))
            return text
            
        data['i18n'] = _
        data['lang'] = lang
        
        return await handler(event, data)
