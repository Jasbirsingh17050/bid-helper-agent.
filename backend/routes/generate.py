from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database.vector_db import search_projects
from database.db import generations_collection, settings_collection
from database.models import GenerationRecord, Revision
from routes.auth import get_current_user
import os
from groq import AsyncGroq
from datetime import datetime, timezone
from duckduckgo_search import DDGS  # NEW: Web Search Library

router = APIRouter(prefix="/generate", tags=["AI Generation"])

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

class BidRequest(BaseModel):
    lead_text: str
    tone: str = "Professional"
    size: str = "Medium"
    project_category: str = "General / Other"

class ReviseRequest(BaseModel):
    generation_id: str
    current_content: str
    instruction: str

def perform_web_search(query: str, max_results=2):
    """Searches the live internet for context to help the AI."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            if not results:
                return "No specific live web context found."
            
            search_context = "Live Internet Research:\n"
            for res in results:
                search_context += f"- {res['title']}: {res['body']}\n"
            return search_context
    except Exception as e:
        return f"Live web search temporarily unavailable."

@router.post("/bid")
async def generate_bid(request: BidRequest, current_user: dict = Depends(get_current_user)):
    try:
        # 1. Search Qdrant for matching past projects
        search_results = await search_projects(request.lead_text, limit=2)
        
        kb_context = ""
        retrieved_ids = []
        for hit in search_results:
            kb_context += hit["payload"].get("text_content", "") + "\n\n"
            retrieved_ids.append(hit["payload"].get("project_title", "Unknown"))
            
        if not kb_context.strip():
            kb_context = "No specific past projects found for this domain. Rely on general expertise."

        # 2. Fetch Admin Settings to enforce Banned Phrases
        settings_doc = await settings_collection.find_one({})
        banned_phrases_instruction = ""
        if settings_doc:
            banned_phrases = settings_doc.get("banned_phrases", [])
            if banned_phrases:
                banned_phrases_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST NOT use any of the following cliché phrases in your response: {', '.join(banned_phrases)}."

        # 3. Perform Live Web Search
        search_query = request.lead_text[:60].replace('\n', ' ')
        web_context = perform_web_search(search_query)

        # 4. Enforce Strict Size and Structure Rules
        size_prompt = ""
        if request.size == "Short":
            size_prompt = (
                "SIZE REQUIREMENT: Small / Short Bid (100 - 300 Words STRICT). "
                "Target Scope: Simple, transactional proposals. Ideal Length: Under 1.5 minutes read time. "
                "Core Structure: 1. Direct hook showing you read the requirements. 2. Brief statement of your immediate technical solution. 3. A single call-to-action (e.g., 'Let's hop on a 5-minute call')."
            )
        elif request.size == "Medium":
            size_prompt = (
                "SIZE REQUIREMENT: Medium Bid (400 - 800 Words STRICT). "
                "Target Scope: Standard milestones or fixed-price projects. Ideal Length: Around 2 to 4 minutes read time. "
                "Core Structure: 1. Executive summary of current pain points. 2. Defined phase breakdowns (e.g., Week 1 Discovery, Week 2 Build). 3. Explicit timeline, milestones, and high-level risk mitigations."
            )
        else:
            size_prompt = (
                "SIZE REQUIREMENT: Large Bid (1,200 - 3,000+ Words STRICT). "
                "Target Scope: Enterprise RFPs, corporate service contracts. Ideal Length: Detailed formal reading. "
                "Core Structure: 1. Rigorous technical architecture layout. 2. Team qualifications/case studies. 3. Legal terms, strict SLAs, and change-management protocols."
            )

        # 5. Create the System Prompt
        system_prompt = (
            f"You are an expert sales engineer and proposal writer specializing in {request.project_category} projects. "
            "Write a highly convincing, professional bid for the following job lead.\n\n"
            f"Please write it in a '{request.tone}' tone, and perfectly follow this size constraint:\n"
            f"{size_prompt}\n\n"
            f"Tailor your language, technologies, and approach specifically for a {request.project_category} project.\n\n"
            "Here is live internet research regarding the client/topic to make your bid more specific and impressive:\n"
            f"{web_context}\n\n"
            "Use the following successful past projects from our company as evidence of our expertise. "
            "Incorporate relevant metrics and technologies from these past projects to prove we can do the job:\n"
            f"{kb_context}\n\n"
            "Important: Do not invent any past projects. Only use the ones provided above."
            f"{banned_phrases_instruction}"
        )

        # 6. Call Groq API
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.lead_text}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
        )
        
        generated_text = chat_completion.choices[0].message.content

        # 6. Save the generation to MongoDB History
        generation_doc = GenerationRecord(
            user_id=str(current_user["_id"]),
            lead_text=request.lead_text,
            tone=request.tone,
            size=request.size,
            project_category=request.project_category,
            revisions=[Revision(content=generated_text, action_type="original")],
            retrieved_kb_ids=retrieved_ids
        )
        
        # Drop the empty default ID so MongoDB auto-generates a unique one
        doc_dict = generation_doc.model_dump(by_alias=True)
        if doc_dict.get("_id") == "":
            del doc_dict["_id"]
        
        insert_result = await generations_collection.insert_one(doc_dict)

        return {
            "content": generated_text, 
            "generation_id": str(insert_result.inserted_id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/ai-revise")
async def ai_revise_bid(request: ReviseRequest, current_user: dict = Depends(get_current_user)):
    try:
        system_prompt = (
            "You are an expert editor. You will be given a current sales bid and an instruction on how to change it. "
            "Output ONLY the newly revised bid text. Do not include introductory text like 'Here is the revised bid'."
        )
        
        user_prompt = f"CURRENT BID:\n{request.current_content}\n\nINSTRUCTION: {request.instruction}\n\nREVISED BID:"

        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
        )
        
        revised_text = chat_completion.choices[0].message.content

        from bson import ObjectId
        await generations_collection.update_one(
            {"_id": ObjectId(request.generation_id)},
            {"$push": {"revisions": {"content": revised_text, "action_type": "ai_revise", "timestamp": datetime.now(timezone.utc)}}}
        )

        return {"content": revised_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Revision failed: {str(e)}")