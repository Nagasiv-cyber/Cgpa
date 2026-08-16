import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
# pyrefly: ignore [missing-import]
import jwt
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer
try:
    from backend.database import get_database
except ImportError:
    try:
        from database import get_database
    except ImportError:
        from .database import get_database
# pyrefly: ignore [missing-import]
from bson import ObjectId, errors as bson_errors

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkeychangeinproduction12345")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def safe_object_id(id_str: str) -> Optional[ObjectId]:
    """Safely convert a string ID to a MongoDB ObjectId."""
    try:
        return ObjectId(id_str)
    except (bson_errors.InvalidId, TypeError):
        return None

def hash_password(password: str) -> str:
    """Hash plain text password with bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token with UTC expiration."""
    to_encode = data.copy()
    if "sub" in to_encode and isinstance(to_encode["sub"], str):
        to_encode["sub"] = to_encode["sub"].strip().lower()
        
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token handling specific exceptions."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, jwt.PyJWTError):
        return None

async def get_current_user() -> Dict[str, Any]:
    """Dependency to retrieve currently authenticated user from token (Mocked for dev)."""
    # Bypass auth for now so frontend integration doesn't fail on protected POST routes
    return {"_id": "dummy", "email": "faculty@example.com", "role": "faculty"}

