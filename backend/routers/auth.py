# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status, Depends, Body
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional

try:
    from backend.database import get_database
    from backend.auth_utils import hash_password, verify_password, create_access_token, get_current_user
    from backend.schemas import UserRegister, UserLogin, UserResponse, Token
except ImportError:
    try:
        from database import get_database
        from auth_utils import hash_password, verify_password, create_access_token, get_current_user
        from schemas import UserRegister, UserLogin, UserResponse, Token
    except ImportError:
        from ..database import get_database
        from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user
        from ..schemas import UserRegister, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    db = get_database()
    
    # Check existing user
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "role": user_data.role,
    }
    
    result = await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )

@router.post("/login", response_model=Token)
async def login_user(login_data: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "faculty")})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=user.get("role", "faculty")
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        role=current_user.get("role", "faculty")
    )
