"""Persistence layer for FloodSafe's production workflow.

Use DATABASE_URL=postgresql+psycopg://... in production. Local development
falls back to SQLite so the API can be exercised without infrastructure.
"""
import os
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./floodsafe.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class UserRole(str, Enum):
    USER = "user"
    RESPONDER = "responder"
    ADMIN = "admin"
    AMBULANCE = "ambulance"
    FIRE_RESCUE = "fire_rescue"


class EmergencyStatus(str, Enum):
    REPORTED = "reported"
    TRIAGED = "triaged"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    role: Mapped[str] = mapped_column(String(32), default=UserRole.USER.value)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="responder")


class RoadClosure(Base):
    __tablename__ = "road_closures"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    area_id: Mapped[str] = mapped_column(String(64), index=True)
    reason: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default="active")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_type: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(Text)
    area_id: Mapped[str] = mapped_column(String(64), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    priority: Mapped[str] = mapped_column(String(16), default="high")
    status: Mapped[str] = mapped_column(String(32), default=EmergencyStatus.REPORTED.value, index=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    assignment: Mapped["Assignment | None"] = relationship(back_populates="request", uselist=False)


class Assignment(Base):
    __tablename__ = "assignments"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("emergency_requests.id"), unique=True)
    responder_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(32), default=EmergencyStatus.ASSIGNED.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    request: Mapped[EmergencyRequest] = relationship(back_populates="assignment")
    responder: Mapped[User] = relationship(back_populates="assignments")


def init_db() -> None:
    Base.metadata.create_all(engine)


def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
