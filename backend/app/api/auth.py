from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

from app.core.db import get_db
from app.models.models import AdminUser, User
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

class AdminLogin(BaseModel):
    login: str
    password: str

from fastapi import APIRouter, Depends, HTTPException, Body, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        login: str = payload.get("sub")
        if login is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return login
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

import hmac
import hashlib
import json
from urllib.parse import parse_qsl

def validate_telegram_data(init_data: str, bot_token: str):
    try:
        parsed_data = dict(parse_qsl(init_data, strict_parsing=True))
        if 'hash' not in parsed_data: return None
        
        hash_value = parsed_data.pop('hash')
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if calculated_hash == hash_value:
            return json.loads(parsed_data['user'])
    except Exception: pass
    return None

from fastapi.security import OAuth2PasswordBearer
from app.models.models import AdminUser, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
client_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/telegram") # Just for reference

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        login: str = payload.get("sub")
        if login is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return login
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

@router.post("/telegram")
async def auth_telegram(initData: str = Body(...)):
    user_data = validate_telegram_data(initData, settings.bot_token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")
    
    # Issue token
    token = jwt.encode({"sub": str(user_data['id']), "exp": datetime.utcnow() + timedelta(days=30)}, settings.secret_key, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "user": user_data}

@router.post("/login")
async def admin_login(data: AdminLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.login == data.login))
    admin = result.scalar_one_or_none()
    
    if not admin or not pwd_context.verify(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({"sub": admin.login, "exp": datetime.utcnow() + timedelta(days=1)}, settings.secret_key, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
async def admin_change_password(data: ChangePassword, current_admin: str = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.login == current_admin))
    admin = result.scalar_one()
    
    if not pwd_context.verify(data.old_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Old password incorrect")
    
    admin.password_hash = pwd_context.hash(data.new_password)
    await db.commit()
    return {"status": "ok"}
