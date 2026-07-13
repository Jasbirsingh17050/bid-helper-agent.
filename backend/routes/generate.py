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
from duckduckgo_search import DDGS  

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

class ReviseRequest(BaseModel):
    generation_id: str
    current_content: str
    instruction: str

def perform_web_search(query: str, max_results=2):
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
        search_results = await search_projects(request.lead_text, limit=2)
        
        kb_context = ""
        retrieved_ids = []
        for hit in search_results:
            kb_context += hit["payload"].get("text_content", "") + "\n\n"
            retrieved_ids.append(hit["payload"].get("project_title", "Unknown"))
            
        if not kb_context.strip():
            kb_context = "No specific past projects found for this domain. Rely on general expertise."

        settings_doc = await settings_collection.find_one({})
        banned_phrases_instruction = ""
        if settings_doc:
            banned_phrases = settings_doc.get("banned_phrases", [])
            if banned_phrases:
                banned_phrases_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST NOT use any of the following cliché phrases in your response: {', '.join(banned_phrases)}."

        search_query = request.lead_text[:60].replace('\n', ' ')
        web_context = perform_web_search(search_query)

        import json # We need this to parse the AI's grading!

        # -------------------------------------------------------------
        # HARSH STRICT WORD COUNT ENFORCEMENT
        # -------------------------------------------------------------
        size_prompt = ""
        
        # If Custom Words is filled out, completely IGNORE the dropdown
        if request.word_count_target and request.word_count_target.strip():
            target = request.word_count_target.strip()
            size_prompt = (
                f"CRITICAL SIZE REQUIREMENT: You MUST write a proposal that is AT LEAST {target} words long. "
                "Do not summarize. To hit this massive word count, you MUST include the following exhaustive sections:\n"
                "1. Deep-Dive Executive Summary & Client Vision (Very Detailed)\n"
                "2. Exhaustive Technical Architecture & Tech Stack Justification\n"
                "3. 6-Phase Implementation Timeline (Provide multiple paragraphs per phase detailing deliverables)\n"
                "4. Rigorous Risk Mitigation & QA Testing Protocols\n"
                "5. Long-term Support, SLAs, and Scalability Plan\n"
                "6. Detailed Conclusion & Financial ROI projection.\n"
                f"Keep elaborating with rich, professional detail until you absolutely surpass {target} words."
            )
        # Fall back to strict mathematical rules for the dropdown
        elif request.size == "Short":
            size_prompt = (
                "SIZE REQUIREMENT: Small / Short Bid (STRICTLY 100 - 200 Words MAX).\n"
                "CRITICAL: Do NOT exceed 200 words. Cut out all fluff.\n"
                "Target Scope: Simple, transactional proposals.\n"
                "Core Structure: 1. Direct hook showing you read the requirements. 2. Brief statement of your immediate technical solution. 3. A single call-to-action."
            )
        elif request.size == "Medium":
            size_prompt = (
                "SIZE REQUIREMENT: Medium Bid (STRICTLY 200 - 320 Words MAX).\n"
                "CRITICAL: Do NOT exceed 320 words under any circumstance.\n"
                "Target Scope: Standard milestones or fixed-price redesigns.\n"
                "Core Structure: 1. Executive summary of current pain points. 2. Defined phase breakdowns. 3. Explicit timeline, milestones, and high-level risk mitigations."
            )
        else:
            size_prompt = (
                "SIZE REQUIREMENT: Large Bid (STRICTLY 320 - 550 Words MAX).\n"
                "CRITICAL: Keep this strictly between 320 and 550 words.\n"
                "Target Scope: Enterprise RFPs, corporate service contracts.\n"
                "Core Structure: 1. Rigorous technical architecture layout. 2. Team qualifications/case studies. 3. Legal terms, SLAs, and change-management protocols."
            )

        system_prompt = (
            f"You are an expert sales engineer and proposal writer specializing in {request.project_category} projects. "
            "Write a highly convincing, professional bid for the following job lead.\n\n"
            f"TARGET AUDIENCE: You are writing this proposal specifically for a {request.target_audience}. "
            "Tailor your vocabulary, technical depth, and value proposition to appeal directly to this persona's priorities.\n\n"
            f"Please write it in a '{request.tone}' tone.\n\n"
            f"{size_prompt}\n\n"
            f"Tailor your language, technologies, and approach specifically for a {request.project_category} project.\n\n"
            "Here is live internet research regarding the client/topic to make your bid more specific and impressive:\n"
            f"{web_context}\n\n"
            "Use the following successful past projects from our company as evidence of our expertise. "
            "Incorporate relevant metrics and technologies from these past projects to prove we can do the job:\n"
            f"{kb_context}\n\n"
            "Important: Do not invent any past projects. Only use the ones provided above."
            f"{banned_phrases_instruction}\n\n"
            "CRITICAL: You MUST output ONLY a valid JSON object. Do not include markdown blocks or any other text outside the JSON. "
            "Your JSON must have EXACTLY two keys:\n"
            "1. 'content': A string containing the fully formatted markdown proposal.\n"
            "2. 'confidence_score': An integer between 1 and 100 representing how confident you are that this bid will win, based on our knowledge base match and the lead quality."
        )

        # -------------------------------------------------------------
        # UPGRADED TO THE MASSIVE 70-BILLION PARAMETER MODEL
        # -------------------------------------------------------------
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
        except Exception as e:
            generated_text = raw_output
            confidence_score = 85

        generation_doc = GenerationRecord(
            user_id=str(current_user["_id"]),
            lead_text=request.lead_text,
            tone=request.tone,
            size=request.size,
            project_category=request.project_category,
            target_audience=request.target_audience,
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
            model="llama-3.3-70b-versatile", # <--- UPGRADE IS HERE
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