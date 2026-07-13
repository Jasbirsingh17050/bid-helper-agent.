# ... existing code ...
class NewRevisionInput(BaseModel):
    content: str
    action_type: str = "manual_edit"

# NEW: Schema for outcome tracking
class OutcomeUpdate(BaseModel):
    outcome: str

@router.get("/my-bids")
# ... existing code ...
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bid not found or access denied.")

        return {"message": "Revision saved successfully!", "revision": rev_dict}
    except Exception as e:
        logger.error(f"Database error in add_revision: {e}")
        raise HTTPException(status_code=500, detail="Could not save revision.")

# NEW: Endpoint to tag wins/losses
@router.put("/{generation_id}/outcome")
async def update_outcome(
    generation_id: str, 
    outcome_data: OutcomeUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Tag a bid as Won or Lost."""
    try:
        obj_id = ObjectId(generation_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid generation ID format")

    if outcome_data.outcome not in ["Won", "Lost"]:
        raise HTTPException(status_code=400, detail="Invalid outcome tag. Use 'Won' or 'Lost'.")

    try:
        result = await generations_collection.update_one(
            {"_id": obj_id, "user_id": str(current_user["_id"])},
            {"$set": {"outcome_tag": outcome_data.outcome}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bid not found or access denied.")

        return {"message": f"Bid marked as {outcome_data.outcome}!"}
    except Exception as e:
        logger.error(f"Database error in update_outcome: {e}")
        raise HTTPException(status_code=500, detail="Could not update outcome.")