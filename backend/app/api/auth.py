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

@router.post("/login")
async def admin_login(data: AdminLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.login == data.login))
    admin = result.scalar_one_or_none()
    
    if not admin or not pwd_context.verify(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({"sub": admin.login, "exp": datetime.utcnow() + timedelta(days=1)}, settings.secret_key, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
