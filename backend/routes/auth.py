from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from database.db import users_collection
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from google.oauth2 import id_token
from google.auth.transport import requests

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

# Security Configurations
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_for_login_change_later")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Tells FastAPI where the client gets the token from
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Pydantic Schemas for Request/Response Validation
class UserSignUp(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = Field(default="team", description="Role can be 'admin' or 'team'")

class GoogleToken(BaseModel):
    token: str

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency Functions (The "Locks") ---

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token to find who is logging in
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Find the user in the database
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    # Check if the currently logged-in user is an admin
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    return current_user

# --- Endpoints ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUp):
    # 1. Check if user already exists
    existing_user = await users_collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken."
        )
    
    # 2. Normalize role choice
    role = user_data.role.lower()
    if role not in ["admin", "team"]:
        role = "team"

    # 3. Hash the password and structure the document
    hashed_password = hash_password(user_data.password)
    new_user_doc = {
        "username": user_data.username,
        "password_hash": hashed_password,
        "role": role,
        "is_active": True,
        "created_at": datetime.utcnow()
    }

    # 4. Save directly into MongoDB
    await users_collection.insert_one(new_user_doc)
    
    return {
        "message": "User registered successfully!",
        "username": user_data.username,
        "role": role
    }

@router.post("/login")
async def login(credentials: OAuth2PasswordRequestForm = Depends()):
    # 1. Look up user in MongoDB
    user = await users_collection.find_one({"username": credentials.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # 2. Verify account status
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by an administrator."
        )

    # 3. Check password hash
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # 4. Generate the JWT token
    token_data = {"sub": user["username"], "role": user["role"]}
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

@router.post("/google")
async def google_login(google_data: GoogleToken):
    try:
        # 1. Verify token with Google
        CLIENT_ID = "742455468037-15nrh5etl1r764tu66958coe6437rs4m.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(google_data.token, requests.Request(), CLIENT_ID)
        
        # 2. Extract user info
        email = idinfo['email']
        username = email.split('@')[0] # e.g. "john.doe" from "john.doe@gmail.com"
        
        # 3. Check if user exists in our DB
        user = await users_collection.find_one({"username": username})
        
        if not user:
            # Create a new user automatically
            new_user_doc = {
                "username": username,
                "password_hash": "GOOGLE_AUTH_NO_PASSWORD", 
                "role": "team", # Default role for new Google users
                "is_active": True,
                "created_at": datetime.utcnow(),
                "email": email
            }
            await users_collection.insert_one(new_user_doc)
            user = new_user_doc
            
        # 4. Check if active
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated.")
            
        # 5. Generate standard JWT token
        token_data = {"sub": user["username"], "role": user["role"]}
        access_token = create_access_token(token_data)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user["role"],
            "username": user["username"]
        }
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

# ---------------------------------------------------------
# NEW: ADMIN USER MANAGEMENT ENDPOINTS
# ---------------------------------------------------------
class UserStatusUpdate(BaseModel):
    is_active: bool

@router.get("/users")
async def get_all_users(current_admin: dict = Depends(get_current_admin)):
    cursor = users_collection.find({})
    users = await cursor.to_list(length=1000)
    
    sanitized_users = []
    for u in users:
        sanitized_users.append({
            "id": str(u["_id"]),
            "username": u["username"],
            "role": u["role"],
            "is_active": u.get("is_active", True),
            "created_at": u.get("created_at")
        })
    return {"users": sanitized_users}

@router.put("/users/{username}/status")
async def update_user_status(username: str, status_data: UserStatusUpdate, current_admin: dict = Depends(get_current_admin)):
    # Security Check: Prevent an admin from locking themselves out!
    if username == current_admin["username"]:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account.")

    result = await users_collection.update_one(
        {"username": username},
        {"$set": {"is_active": status_data.is_active}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return {"message": f"User {username} status updated successfully."}