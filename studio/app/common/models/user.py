from datetime import datetime
from typing import Dict, Optional

from sqlalchemy.sql.functions import current_timestamp
from sqlmodel import JSON, Column, Field, Integer, String, UniqueConstraint

from studio.app.common.models.base import Base, TimestampMixin


class User(Base, TimestampMixin, table=True):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("uid", name="idx_uid"),)

    organization_id: int = Field(nullable=False)
    uid: str = Field(sa_column=Column(String(100), nullable=False))
    name: str = Field(sa_column=Column(String(100), nullable=False))
    email: str = Field(sa_column=Column(String(255), nullable=False))
    attributes: Optional[Dict] = Field(default={}, sa_column=Column(JSON))
    active: bool = Field(nullable=False)


class Organization(Base, table=True):
    __tablename__ = "organization"

    name: str = Field(sa_column=Column(String(100), nullable=False))
    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": current_timestamp()},
    )


class Role(Base, table=True):
    __tablename__ = "roles"

    role: str = Field(sa_column=Column(String(100), nullable=False))
    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": current_timestamp()},
    )


class UserRole(Base, table=True):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="idx_user_id"),)

    user_id: int = Field(
        sa_column=Column(
            Integer(),
            nullable=False,
            comment="foregn key for users.id",
        ),
        nullable=False,
    )
    role_id: int = Field(
        sa_column=Column(
            Integer(),
            nullable=False,
            comment="foregn key for roles.id",
        ),
    )
    created_at: Optional[datetime] = Field(
        sa_column_kwargs={"server_default": current_timestamp()},
    )