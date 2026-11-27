from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.tenant import Tenant
from app.services.auth_service import decode_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT token, return the current user."""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload.") from exc
    if not 0 < user_id <= 2**63 - 1:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    return user


async def require_telemetry_access(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Keep the existing shared telemetry store within one configured tenant."""
    if settings.DEBUG and settings.TELEMETRY_TENANT_ID is None:
        return
    if credentials is None:
        raise HTTPException(status_code=401, detail="Bearer token required.",
                            headers={"WWW-Authenticate": "Bearer"})
    user = await get_current_user(credentials, db)
    if settings.TELEMETRY_TENANT_ID is None or user.tenant_id != settings.TELEMETRY_TENANT_ID:
        raise HTTPException(status_code=403, detail="Telemetry tenant access required.")
    tenant = await db.get(Tenant, user.tenant_id)
    if tenant is None or not tenant.is_active:
        raise HTTPException(status_code=403, detail="Telemetry tenant is inactive.")

def require_roles(*roles: UserRole):
    """Factory that returns a dependency checking the user has one of the given roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


# Shorthand dependencies for common role combos
require_analyst_or_above = require_roles(
    UserRole.analyst, UserRole.admin, UserRole.super_admin
)
require_admin_or_above = require_roles(
    UserRole.admin, UserRole.super_admin
)
require_super_admin = require_roles(UserRole.super_admin)



