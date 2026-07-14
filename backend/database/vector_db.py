from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding
import uuid

# 1. Initialize the lightweight FastEmbed model (Replaces heavy PyTorch)
print("Loading Lightweight AI Embedding Model...")
model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
print("AI Model loaded successfully!")

# 2. Initialize Qdrant Client (saving data locally to a folder named 'qdrant_data')
qdrant = QdrantClient(path="qdrant_data")

COLLECTION_NAME = "knowledge_base"

# 3. Create the collection if it doesn't exist
try:
    qdrant.get_collection(COLLECTION_NAME)
except Exception:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

def generate_project_text(row):
    """Combines CSV columns into a single rich text block for the AI to read."""
    return (
        f"Project Title: {row.get('project_title', '')}\n"
        f"Client Industry: {row.get('client_industry', '')}\n"
        f"Tech Stack: {row.get('tech_stack', '')}\n"
        f"Problem Statement: {row.get('problem_statement', '')}\n"
        f"Solution Summary: {row.get('solution_summary', '')}\n"
        f"Outcome: {row.get('outcome', '')}"
    )

async def upsert_batch_to_qdrant(df, batch_id):
    """Embeds and uploads a dataframe of projects to Qdrant."""
    points = []
    
    # Replace any empty CSV cells (NaN) with empty strings
    df = df.fillna("")
    
    for index, row in df.iterrows():
        # 1. Create a rich text representation of the project
        text_content = generate_project_text(row)
        
        # 2. Generate the embedding using FastEmbed
        vector = list(model.embed([text_content]))[0].tolist()
        
        # 3. Prepare metadata payload
        payload = row.to_dict()
        payload["batch_id"] = batch_id
        payload["text_content"] = text_content
        
        # 4. Create a point struct
        point_id = str(uuid.uuid4())
        points.append(
            PointStruct(id=point_id, vector=vector, payload=payload)
        )
        
    # 5. Upload all processed rows to Qdrant!
    if points:
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )

# --- NEW: AUTO-LEARNING FEEDBACK LOOP (RLHF) ---
async def upsert_winning_proposal_to_qdrant(generation_id: str, lead_text: str, proposal_text: str, category: str):
    """Embeds a successfully won proposal and injects it into the active knowledge base."""
    # 1. Create a structured text representation of the won project
    text_content = (
        f"Project Title: Auto-Learned Won Proposal ({generation_id})\n"
        f"Client Industry: {category}\n"
        f"Problem Statement (Client Request): {lead_text}\n\n"
        f"Winning Solution/Proposal:\n{proposal_text}"
    )
    
    # 2. Generate the embedding using FastEmbed
    vector = list(model.embed([text_content]))[0].tolist()
    
    # 3. Prepare metadata payload specifically for self-learned data
    payload = {
        "batch_id": "auto_rlhf_feedback",
        "project_title": f"Auto-Learned Won Proposal",
        "client_industry": category,
        "text_content": text_content,
        "source": "rlhf_feedback_loop"
    }
    
    # 4. Create a point struct with a guaranteed valid UUID
    point_id = str(uuid.uuid4())
    
    # 5. Inject into Qdrant directly
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[PointStruct(id=point_id, vector=vector, payload=payload)]
    )
    print(f"✅ RLHF Success: Injected won proposal {generation_id} into Knowledge Base!")

async def search_projects(lead_text: str, limit: int = 3):
    """Embeds the lead text and searches Qdrant for the closest matching projects."""
    # 1. Convert the user's job lead into an embedding
    query_vector = list(model.embed([lead_text]))[0].tolist()
    
    # 2. Search Qdrant
    search_results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit
    )
    
    # 3. Format the results
    results = []
    for hit in search_results.points:
        results.append({
            "score": hit.score,
            "payload": hit.payload
        })
    return results