from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, Numeric, ForeignKey, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from .base import Base

class AccessLevelEnum(str, enum.Enum):
    read_only = "read_only"
    full_access = "full_access"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    canceled = "canceled"
    failed = "failed"

class DiscountTypeEnum(str, enum.Enum):
    percent = "percent"
    fixed = "fixed"

channel_tariffs = Table(
    'channel_tariffs', Base.metadata,
    Column('channel_id', Integer, ForeignKey('channels.id')),
    Column('tariff_id', Integer, ForeignKey('tariffs.id'))
)

class User(Base):
    __tablename__ = "users"
    
    telegram_id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    referrer_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=True)
    utm_source = Column(String, nullable=True)
    balance = Column(Numeric(10, 2), default=0.0)
    language_code = Column(String, default='ru')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    referrals = relationship("User", backref="referrer", remote_side=[telegram_id])
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    telegram_chat_id = Column(BigInteger, unique=True, index=True)
    title = Column(String)
    type = Column(String) # channel or supergroup
    invite_link = Column(String, nullable=True)
    welcome_text = Column(String, nullable=True)
    pin_welcome = Column(Boolean, default=False)

    tariffs = relationship("Tariff", secondary=channel_tariffs, back_populates="channels")

class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    price = Column(Numeric(10, 2))
    currency = Column(String) # RUB / XTR
    duration_days = Column(Integer, default=30) # 0 = forever
    access_level = Column(Enum(AccessLevelEnum), default=AccessLevelEnum.full_access)
    is_recurring = Column(Boolean, default=False)
    trial_days = Column(Integer, default=0)

    channels = relationship("Channel", secondary=channel_tariffs, back_populates="tariffs")
    subscriptions = relationship("Subscription", back_populates="tariff")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    tariff_id = Column(Integer, ForeignKey("tariffs.id"))
    start_date = Column(DateTime(timezone=True), default=func.now())
    end_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=False)
    payment_method_id = Column(String, nullable=True)

    user = relationship("User", back_populates="subscriptions")
    tariff = relationship("Tariff", back_populates="subscriptions")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.telegram_id"))
    amount = Column(Numeric(10, 2))
    currency = Column(String)
    provider = Column(String) # yookassa / telegram_stars
    provider_payment_id = Column(String, unique=True)
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="payments")

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_type = Column(Enum(DiscountTypeEnum))
    value = Column(Numeric(10, 2))
    usage_limit = Column(Integer, default=1)
    used_count = Column(Integer, default=0)
    valid_until = Column(DateTime(timezone=True), nullable=True)

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True)
    password_hash = Column(String)
    telegram_id = Column(BigInteger, nullable=True)

class BotConfig(Base):
    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True)
    title = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
