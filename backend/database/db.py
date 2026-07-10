import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Create the MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# ... existing code ...
# Collections
users_collection = db["users"]
kb_batches_collection = db["kb_batches"]
generations_collection = db["generations"]
settings_collection = db["settings"]