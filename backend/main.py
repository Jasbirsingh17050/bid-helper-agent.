from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ... existing code ...
from routes import auth, kb, generate, history, settings

app = FastAPI(title="Bid Helper Agent API")

# Enable CORS so the React frontend can talk to the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Connect the routers
app.include_router(auth.router)
app.include_router(kb.router)
app.include_router(generate.router)
app.include_router(history.router)
app.include_router(settings.router) # <-- ADD THIS NEW LINE!