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
import requests
import re

router = APIRouter(prefix="/generate", tags=["AI Generation"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

class BidRequest(BaseModel):
    lead_text: str
    tone: str = "Professional"
    size: str = "Medium"
    project_category: str = "General / Other"
    word_count_target: Optional[str] = ""
    target_audience: str = "General Manager / CEO"
    client_objection: Optional[str] = ""
    client_website_url: Optional[str] = ""

class ReviseRequest(BaseModel):
    generation_id: str
    current_content: str
    instruction: str

# NEW: Schema for our Highlighted Snippet logic
class SnippetReviseRequest(BaseModel):
    selected_text: str
    instruction: str

def scrape_website_text(url: str) -> str:
    """Silently visits the client's website and extracts their core text."""
    if not url: return ""
    try:
        if not url.startswith("http"): url = "https://" + url
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            # Strip out code and styling
            text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', response.text, flags=re.IGNORECASE)
            text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text, flags=re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            # Clean up spacing and return the first 2000 characters
            return re.sub(r'\s+', ' ', text).strip()[:2000]
    except Exception as e:
        print(f"Scraping failed: {e}")
    return ""

@router.post("/bid")
async def generate_bid(request: BidRequest, current_user: dict = Depends(get_current_user)):
    try:
        # 1. Search our vector database for past projects (Lightning Fast)
        search_results = await search_projects(request.lead_text, limit=2)
        
        kb_context = ""
        retrieved_ids = []
        for hit in search_results:
            kb_context += hit["payload"].get("text_content", "") + "\n\n"
            retrieved_ids.append(hit["payload"].get("project_title", "Unknown"))
            
        if not kb_context.strip():
            kb_context = "No specific past projects found for this domain. Rely on general expertise."

        # 2. Get settings (Banned Phrases)
        settings_doc = await settings_collection.find_one({})
        banned_phrases_instruction = ""
        if settings_doc:
            banned_phrases = settings_doc.get("banned_phrases", [])
            if banned_phrases:
                banned_phrases_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST NOT use any of the following cliché phrases in your response: {', '.join(banned_phrases)}."

        import json 

        # 3. Dynamic Size & Prompting Logic
        size_prompt = ""
        if request.word_count_target and request.word_count_target.strip():
            target = request.word_count_target.strip()
            size_prompt = (
                f"CRITICAL SIZE REQUIREMENT: You MUST write a proposal that is AT LEAST {target} words long. "
                "Do not summarize. To hit this massive word count, you MUST include the following exhaustive sections:\n"
                "1. Deep-Dive Executive Summary & Client Vision\n"
                "2. Exhaustive Technical Architecture & Tech Stack Justification\n"
                "3. 6-Phase Implementation Timeline\n"
                "4. Rigorous Risk Mitigation & QA Testing Protocols\n"
                "5. Long-term Support, SLAs, and Scalability Plan\n"
                "6. Detailed Conclusion & Financial ROI projection.\n"
                f"Keep elaborating with rich, professional detail until you surpass {target} words."
            )
        elif request.size == "Short":
            size_prompt = (
                "SIZE REQUIREMENT: Small / Short Bid (STRICTLY 100 - 200 Words MAX).\n"
                "CRITICAL: Do NOT exceed 200 words. Cut out all fluff.\n"
                "Target Scope: Simple, transactional proposals."
            )
        elif request.size == "Medium":
            size_prompt = (
                "SIZE REQUIREMENT: Medium Bid (STRICTLY 200 - 320 Words MAX).\n"
                "CRITICAL: Do NOT exceed 320 words under any circumstance.\n"
                "Target Scope: Standard milestones or fixed-price redesigns."
            )
        else:
            size_prompt = (
                "SIZE REQUIREMENT: Large Bid (STRICTLY 320 - 550 Words MAX).\n"
                "CRITICAL: Keep this strictly between 320 and 550 words.\n"
                "Target Scope: Enterprise RFPs, corporate service contracts."
            )

        objection_instruction = ""
        if request.client_objection and request.client_objection.strip():
            objection_instruction = (
                f"\n\nCRITICAL SALES STRATEGY (OVERCOME OBJECTION): The client has a specific worry: '{request.client_objection}'. "
                "You MUST dedicate a specific paragraph in this proposal to preemptively and professionally dismantling this concern. "
                "Use logic, past experience, and strategic reassurance to prove why this won't be an issue."
            )

        # NEW: Inject the scraped website data!
        scraped_context = ""
        if request.client_website_url and request.client_website_url.strip():
            scraped_data = scrape_website_text(request.client_website_url.strip())
            if scraped_data:
                scraped_context = f"\n\nCRITICAL CLIENT INFO (Scraped directly from their website URL): '{scraped_data}'\nYou MUST seamlessly incorporate their company mission, values, or wording into the proposal to make it highly personalized and prove we researched them."

        system_prompt = (
            f"You are an expert sales engineer and proposal writer specializing in {request.project_category} projects. "
            "Write a highly convincing, professional bid for the following job lead.\n\n"
            f"TARGET AUDIENCE: You are writing this proposal specifically for a {request.target_audience}. "
            "Tailor your vocabulary, technical depth, and value proposition to appeal directly to this persona's priorities.\n\n"
            f"Please write it in a '{request.tone}' tone.\n\n"
            f"{size_prompt}\n\n"
            f"{objection_instruction}\n\n"
            f"{scraped_context}\n\n"
            "Use the following successful past projects from our company as evidence of our expertise. "
            "Incorporate relevant metrics and technologies from these past projects to prove we can do the job:\n"
            f"{kb_context}\n\n"
            "Important: Do not invent any past projects. Only use the ones provided above."
            f"{banned_phrases_instruction}\n\n"
            "CRITICAL: You MUST output ONLY a valid JSON object. Do not include markdown blocks or any other text outside the JSON. "
            "Your JSON must have EXACTLY two keys:\n"
            "1. 'content': A string containing the fully formatted markdown proposal.\n"
            "2. 'confidence_score': An integer between 1 and 100 representing how confident you are that this bid will win."
        )

        # 4. Generate with Lightning Fast Groq
        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.lead_text}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=3500,
            response_format={"type": "json_object"}
        )
        
        raw_output = chat_completion.choices[0].message.content
        try:
            parsed_output = json.loads(raw_output)
            generated_text = parsed_output.get("content", "Error parsing content.")
            confidence_score = int(parsed_output.get("confidence_score", 85))
        except Exception:
            generated_text = raw_output
            confidence_score = 85

        # 5. Save Generation Record
        generation_doc = GenerationRecord(
            user_id=str(current_user["_id"]),
            lead_text=request.lead_text,
            tone=request.tone,
            size=request.size,
            project_category=request.project_category,
            target_audience=request.target_audience,
            client_objection=request.client_objection,
            revisions=[Revision(content=generated_text, action_type="original")],
            retrieved_kb_ids=retrieved_ids,
            confidence_score=confidence_score
        )
        
        doc_dict = generation_doc.model_dump(by_alias=True)
        if doc_dict.get("_id") == "":
            del doc_dict["_id"]
        
        insert_result = await generations_collection.insert_one(doc_dict)

        return {
            "content": generated_text, 
            "confidence_score": confidence_score,
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
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4000, 
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

# NEW: Snippet Rewrite Logic
@router.post("/ai-revise-snippet")
async def ai_revise_snippet(request: SnippetReviseRequest, current_user: dict = Depends(get_current_user)):
    """Rewrites ONLY the specific text the user highlighted."""
    try:
        system_prompt = (
            "You are an expert editor. You will be given a specific snippet of text from a sales bid and an instruction on how to change it. "
            "Output ONLY the newly revised text snippet. Do not include introductory text, quotes, or formatting around it."
        )
        user_prompt = f"CURRENT TEXT SNIPPET:\n{request.selected_text}\n\nINSTRUCTION: {request.instruction}\n\nREVISED TEXT SNIPPET:"

        chat_completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000,
        )

        revised_text = chat_completion.choices[0].message.content.strip()
        return {"content": revised_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Snippet Revision failed: {str(e)}")