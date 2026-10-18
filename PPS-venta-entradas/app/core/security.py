from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.now(timezone.utc) + expires_delta,
        "type": token_type,
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT de acceso: vida corta, se usa para autenticar cada request."""
    expires = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data, expires, ACCESS_TOKEN_TYPE)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT de refresco: vida larga, solo sirve para pedir un nuevo access token."""
    expires = expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data, expires, REFRESH_TOKEN_TYPE)


def decode_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    """Decodifica un JWT. Devuelve el payload o None si es inválido/expirado
    o si el claim 'type' no coincide con el esperado."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
    if expected_type and payload.get("type") != expected_type:
        return None
    return payload


def decode_access_token(token: str) -> Optional[str]:
    """Devuelve el 'sub' (username) de un access token válido, o None."""
    payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    return payload.get("sub") if payload else None


def decode_refresh_token(token: str) -> Optional[str]:
    """Devuelve el 'sub' (username) de un refresh token válido, o None."""
    payload = decode_token(token, expected_type=REFRESH_TOKEN_TYPE)
    return payload.get("sub") if payload else None
