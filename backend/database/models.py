from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

# ---------------------------------------------------------
# 1. USER MODELS (For the 'users' collection)
# ---------------------------------------------------------
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: str = Field(default="team") # "admin" or "team"
    status: str = Field(default="active") # "active" or "deactivated"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserInDB(UserBase):
    id: str = Field(default_factory=str, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

# ---------------------------------------------------------
# 2. KNOWLEDGE BASE BATCHES (For 'kb_batches' collection)
# ---------------------------------------------------------
class KBBatch(BaseModel):
    batch_id: str
    uploader_username: str
    row_count: int
    is_active: bool = Field(default=True)
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ---------------------------------------------------------
# 3. GENERATIONS & REVISIONS (For 'generations' collection)
# ---------------------------------------------------------
class Revision(BaseModel):
    content: str
    action_type: str # "original", "regenerate", "polish", "manual_edit"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GenerationRecord(BaseModel):
    id: str = Field(default_factory=str, alias="_id")
    user_id: str
    lead_text: str
    tone: str
    size: str
    revisions: List[Revision] = []
    retrieved_kb_ids: List[str] = []
    supporting_files_used: List[str] = [] # Names only, per ephemeral rule
    outcome_tag: Optional[str] = None # "Won", "Lost", or None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

# ---------------------------------------------------------
# 4. ADMIN SETTINGS (For 'settings' collection)
# ---------------------------------------------------------
class AppSettings(BaseModel):
    active_llm_provider: str = Field(default="openai") # "openai", "gemini", "anthropic"
    daily_generation_limit_per_user: int = Field(default=50)
    banned_phrases: List[str] = [
        "hope this finds you well", "delve", "robust", "seamless"
    ]
    confidential_keywords: List[str] = [
        "agency", "freelancer", "$"
    ]