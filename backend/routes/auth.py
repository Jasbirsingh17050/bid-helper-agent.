from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

# NEW OTP Schemas
class ForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    username: str
    otp: str
    new_password: str = Field(..., min_length=6)

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

def send_otp_email(receiver_email: str, otp_code: str):
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")
    
    if not sender_email or not sender_password:
        print("CRITICAL: MAIL_USERNAME or MAIL_PASSWORD missing in environment variables.")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Password Reset OTP - Bid Helper Agent"
    message["From"] = sender_email
    message["To"] = receiver_email

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>We received a request to reset the password for your Bid Helper Agent account.</p>
            <p>Your 6-digit OTP code is:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <strong style="font-size: 32px; letter-spacing: 5px; color: #1e40af;">{otp_code}</strong>
            </div>
            <p style="font-size: 12px; color: #666;">This code will expire in 15 minutes.</p>
            <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email. Your account is safe.</p>
        </div>
      </body>
    </html>
    """
    message.attach(MIMEText(html, "html"))

    try:
        # ADDED TIMEOUT: 5 seconds max so it doesn't get "stuck" if Render blocks it
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=5) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

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
        CLIENT_ID = "742455468037-15nrh5etl1r764tu66958coe6437rs4m.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(google_data.token, requests.Request(), CLIENT_ID)
        
        email = idinfo['email']
        username = email.split('@')[0] 
        
        user = await users_collection.find_one({"username": username})
        
        if not user:
            new_user_doc = {
                "username": username,
                "password_hash": "GOOGLE_AUTH_NO_PASSWORD", 
                "role": "team",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "email": email
            }
            await users_collection.insert_one(new_user_doc)
            user = new_user_doc
            
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated.")
            
        token_data = {"sub": user["username"], "role": user["role"]}
        access_token = create_access_token(token_data)

        return {"access_token": access_token, "token_type": "bearer", "role": user["role"], "username": user["username"]}
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

# ---------------------------------------------------------
# ADMIN USER MANAGEMENT ENDPOINTS
# ---------------------------------------------------------

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
    if username == current_admin["username"]:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account.")

    result = await users_collection.update_one(
        {"username": username},
        {"$set": {"is_active": status_data.is_active}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return {"message": f"User {username} status updated successfully."}

# ---------------------------------------------------------
# PROFILE MANAGEMENT ENDPOINTS
# ---------------------------------------------------------
@router.get("/profile")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user.get("full_name", ""),
        "profile_picture": current_user.get("profile_picture", "")
    }

@router.put("/profile")
async def update_my_profile(profile_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_fields = {}
    if profile_data.full_name is not None:
        update_fields["full_name"] = profile_data.full_name
    if profile_data.profile_picture is not None:
        update_fields["profile_picture"] = profile_data.profile_picture
        
    if not update_fields:
        return {"message": "No data provided to update."}
        
    await users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": update_fields}
    )
    
    return {"message": "Profile updated successfully!"}

# ---------------------------------------------------------
# NEW: FORGOT PASSWORD & OTP ENDPOINTS
# ---------------------------------------------------------
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # FIX: Check if the user typed an email OR a username, and NO MORE TYPOS!
    user = await users_collection.find_one({
        "$or": [
            {"username": request.username},
            {"email": request.username}
        ]
    })
    
    # We return success even if user isn't found for security
    if not user:
        return {"message": "If that account exists, an OTP has been sent."}

    # Find the email to send to
    receiver_email = user.get("email")
    if not receiver_email:
        if "@" in user["username"]:
            receiver_email = user["username"]
        else:
            raise HTTPException(status_code=400, detail="No email address associated with this username. Please contact an Admin.")

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    otp_expiry = datetime.utcnow() + timedelta(minutes=15)

    # Save OTP to database temporarily
    await users_collection.update_one(
        {"username": user["username"]},
        {"$set": {"otp_code": otp_code, "otp_expiry": otp_expiry}}
    )

    # Send the email!
    email_sent = send_otp_email(receiver_email, otp_code)
    
    if not email_sent:
        # DEMO MODE FALLBACK: If Render blocks the email port, return the OTP to the screen!
        raise HTTPException(
            status_code=400, 
            detail=f"Render Free Tier blocked email. DEMO MODE OTP: {otp_code}"
        )

    return {"message": "OTP sent successfully!"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = await users_collection.find_one({
        "$or": [
            {"username": request.username},
            {"email": request.username}
        ]
    })
    
    if not user or "otp_code" not in user:
        raise HTTPException(status_code=400, detail="Invalid OTP or Username.")
        
    if user["otp_code"] != request.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")
        
    # Check if OTP expired
    if datetime.utcnow() > user["otp_expiry"]:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Hash the new password and clear the OTP fields
    hashed_password = hash_password(request.new_password)
    
    await users_collection.update_one(
        {"username": user["username"]},
        {
            "$set": {"password_hash": hashed_password}, 
            "$unset": {"otp_code": "", "otp_expiry": ""}
        }
    )
    
    return {"message": "Password reset successfully! You can now log in."}