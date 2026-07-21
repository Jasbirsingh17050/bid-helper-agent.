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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

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

class EmailProposalRequest(BaseModel):
    generation_id: str
    client_email: str

def scrape_website_text(url: str) -> str:
    """Silently visits the client's website and extracts their core text."""
    if not url: return ""
    try:
        if not url.startswith("http"): url = "https://" + url
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', response.text, flags=re.IGNORECASE)
            text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text, flags=re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            return re.sub(r'\s+', ' ', text).strip()[:2000]
    except Exception as e:
        print(f"Scraping failed: {e}")
    return ""

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

        import json 
        
        size_prompt = ""
        if request.size == "Short": size_prompt = "SIZE REQUIREMENT: Small / Short Bid (STRICTLY 100 - 200 Words MAX)."
        elif request.size == "Medium": size_prompt = "SIZE REQUIREMENT: Medium Bid (STRICTLY 200 - 320 Words MAX)."
        else: size_prompt = "SIZE REQUIREMENT: Large Bid (STRICTLY 320 - 550 Words MAX)."

        # OPTION 1: CLIENT WEBSITE SCRAPING INJECTION
        scraped_context = ""
        if request.client_website_url and request.client_website_url.strip():
            scraped_data = scrape_website_text(request.client_website_url.strip())
            if scraped_data:
                scraped_context = f"\n\nCRITICAL CLIENT INFO (Scraped directly from their website URL): '{scraped_data}'\nYou MUST seamlessly incorporate their company mission, values, or wording into the proposal to make it highly personalized and prove we researched them."

        system_prompt = (
            f"You are an expert sales engineer and proposal writer specializing in {request.project_category} projects. "
            "Write a highly convincing, professional bid for the following job lead.\n\n"
            f"TARGET AUDIENCE: You are writing this proposal specifically for a {request.target_audience}. "
            f"Please write it in a '{request.tone}' tone.\n\n{size_prompt}\n\n{scraped_context}\n\n"
            "Below are examples of PAST successful projects we have completed:\n"
            f"{kb_context}\n\n"
            "CRITICAL INSTRUCTION REGARDING PAST PROJECTS:\n"
            "Use the past projects ONLY as proof of our expertise. DO NOT assume the current client has the exact same problems as the past clients. "
            "Do not mention irrelevant issues (like website downtime) unless the current client explicitly asked about it in their job lead. Focus strictly on solving the CURRENT client's problem.\n\n"
            f"{banned_phrases_instruction}\n\n"
            "CRITICAL: You MUST output ONLY a valid JSON object with exactly two keys: 'content' (markdown proposal) and 'confidence_score' (1-100 integer)."
        )

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

        return {"content": generated_text, "confidence_score": confidence_score, "generation_id": str(insert_result.inserted_id)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/ai-revise")
async def ai_revise_bid(request: ReviseRequest, current_user: dict = Depends(get_current_user)):
    try:
        system_prompt = "You are an expert editor. Output ONLY the newly revised bid text. Do not include introductory text."
        user_prompt = f"CURRENT BID:\n{request.current_content}\n\nINSTRUCTION: {request.instruction}\n\nREVISED BID:"

        chat_completion = await groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
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

# OPTION 2: EMAIL AGENT ENDPOINT
@router.post("/email-proposal")
async def email_proposal(request: EmailProposalRequest, current_user: dict = Depends(get_current_user)):
    try:
        from bson import ObjectId
        doc = await generations_collection.find_one({"_id": ObjectId(request.generation_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        # Get latest content
        content = doc.get("content", "")
        if doc.get("revisions") and len(doc["revisions"]) > 0:
            content = doc["revisions"][-1]["content"]

        # Format markdown to simple HTML for the email
        html_content = content.replace('\n', '<br/>').replace('**', '<b>').replace('##', '<h2>')

        sender_email = os.getenv("MAIL_USERNAME")
        sender_password = os.getenv("MAIL_PASSWORD")

        if not sender_email or not sender_password:
            raise HTTPException(status_code=500, detail="Server email not configured in Render.")

        message = MIMEMultipart("alternative")
        message["Subject"] = "Strategic Project Proposal"
        message["From"] = sender_email
        message["To"] = request.client_email

        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #2563eb;">Your Custom Project Proposal</h2>
                <p>Hello,</p>
                <p>Please find the strategic proposal for your project below:</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
                <div>{html_content}</div>
            </div>
          </body>
        </html>
        """
        message.attach(MIMEText(html, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, request.client_email, message.as_string())

        return {"message": "Proposal successfully emailed to client!"}
    except smtplib.SMTPException:
         raise HTTPException(status_code=400, detail="Render Free Tier blocked the email port. Upgrade required for live emailing.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")