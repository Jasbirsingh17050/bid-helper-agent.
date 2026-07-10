import logging
from fastapi import APIRouter, Depends, HTTPException
from routes.auth import get_current_admin, get_current_user
from database.db import settings_collection
from database.models import AppSettings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Admin Settings"])

@router.get("/")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Fetch the current app settings. Any authenticated user can view them."""
    # Look for the single settings document in the database
    settings = await settings_collection.find_one({})
    
    if not settings:
        # If the database is brand new and empty, return the defaults from models.py
        default_settings = AppSettings()
        return default_settings.model_dump()
    
    # Convert the MongoDB ObjectId to a string for JSON compatibility
    settings["_id"] = str(settings["_id"])
    return settings

@router.put("/")
async def update_settings(
    new_settings: AppSettings, 
    current_admin: dict = Depends(get_current_admin)
):
    """Update the app settings. ONLY Admins can do this."""
    # Convert the Pydantic model to a dictionary
    settings_dict = new_settings.model_dump()
    
    # Upsert: Replace the first document it finds, or create it if it doesn't exist
    result = await settings_collection.replace_one(
        {}, # Empty filter targets the first document it finds
        settings_dict, 
        upsert=True
    )
    
    return {
        "message": "Global App Settings updated successfully!", 
        "updated_by": current_admin["username"],
        "settings": settings_dict
    }