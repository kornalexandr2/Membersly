from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from passlib.context import CryptContext

from app.core.db import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.models import AdminUser

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.orders import router as orders_router

app = FastAPI(title="Membersly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AdminUser).limit(1))
        if not result.scalar_one_or_none():
            default_admin = AdminUser(login="admin", password_hash=pwd_context.hash("admin1234"))
            session.add(default_admin)
            await session.commit()

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(orders_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
