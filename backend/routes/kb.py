from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from routes.auth import get_current_admin
from database.db import kb_batches_collection
from database.vector_db import upsert_batch_to_qdrant
import pandas as pd
import io
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/kb", tags=["Knowledge Base"])

# Strict Fixed Schema defined in Section 4.1 of the spec
REQUIRED_COLUMNS = [
    "project_title",
    "client_industry",
    "tech_stack",
    "problem_statement",
    "solution_summary",
    "outcome",
    "project_url"
]

@router.get("/test-lock")
async def test_admin_lock(current_user: dict = Depends(get_current_admin)):
    """Test endpoint to verify Admin JWT tokens."""
    return {
        "message": f"Lock bypassed successfully! Welcome Admin: {current_user['username']}",
        "role": current_user["role"]
    }

@router.post("/upload")
async def upload_kb_csv(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_admin)
):
    """Upload and validate a historical bids CSV file."""
    # 1. Validate file extension
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    try:
        # 2. Read and parse the CSV into memory
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # 3. Enforce the Fixed Schema (Section 4.1)
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"CSV schema mismatch. Missing required columns: {', '.join(missing_cols)}"
            )
            
        # 4. Generate Batch Metadata
        batch_id = f"batch_{uuid.uuid4().hex[:8]}"
        row_count = len(df)
        
        # 5. Save Batch Metadata to MongoDB
        batch_doc = {
            "batch_id": batch_id,
            "uploader_username": current_user["username"],
            "row_count": row_count,
            "is_active": True,
            "uploaded_at": datetime.now(timezone.utc)
        }
        await kb_batches_collection.insert_one(batch_doc)
        
        # 6. ENCODE AND SAVE TO QDRANT!
        await upsert_batch_to_qdrant(df, batch_id)
        
        return {
            "message": "CSV uploaded, metadata saved to MongoDB, and vectors saved to Qdrant successfully!",
            "batch_id": batch_id,
            "total_projects_found": row_count,
            "uploader": current_user["username"]
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")