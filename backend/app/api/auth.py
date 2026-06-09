from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.services.auth_service import (
    hash_password, authenticate_user, create_access_token
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    tenant_name: str      # creates a new tenant for this user
    tenant_slug: str      # e.g. "acme-corp" — must be unique

class LoginRequest(BaseModel):
    email: str
    password: str

class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.viewer


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", summary="Register a new tenant + admin user")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new tenant and the first admin user for that tenant.
    Used when a new company signs up.
    """
    # Check slug is unique
    existing = await db.execute(select(Tenant).where(Tenant.slug == payload.tenant_slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tenant slug already taken.")

    # Check email is unique
    existing_user = await db.execute(select(User).where(User.email == payload.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Create tenant
    tenant = Tenant(name=payload.tenant_name, slug=payload.tenant_slug)
    db.add(tenant)
    await db.flush()  # get tenant.id

    # Create admin user for this tenant
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.admin,
        tenant_id=tenant.id,
    )
    db.add(user)
    await db.commit()

    token = create_access_token({"sub": str(user.id), "tenant_id": tenant.id, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
        "tenant": tenant.to_dict(),
    }


@router.post("/login", summary="Login and get JWT token")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(payload.email, payload.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Get tenant info
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()

    token = create_access_token({
        "sub": str(user.id),
        "tenant_id": user.tenant_id,
        "role": user.role,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
        "tenant": tenant.to_dict() if tenant else None,
    }


@router.get("/me", summary="Get current logged-in user info")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


@router.post("/users", summary="Admin: create a user within your tenant")
async def create_user(
    payload: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admins can create analyst/viewer accounts within their own tenant."""
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(status_code=403, detail="Only admins can create users.")

    # Prevent creating super_admin via this endpoint
    if payload.role == UserRole.super_admin and current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Cannot assign super_admin role.")

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        tenant_id=current_user.tenant_id,  # same tenant as the admin
    )
    db.add(user)
    await db.commit()

    return {"status": "created", "user": user.to_dict()}