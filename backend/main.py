# backend/main.py
import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from google import genai
from dotenv import load_dotenv

from database import get_db
from models import AssessmentCardResponse

# 1. Brutal Environment Override
# This forces Python to ignore any cached terminal variables and ONLY use the .env file
load_dotenv(override=True)
raw_key = os.getenv("GEMINI_API_KEY", "")

# Clean the key: strip invisible spaces AND accidental quotation marks
GEMINI_API_KEY = raw_key.replace('"', '').replace("'", "").strip()

# 2. Initialize the modern Gemini Client
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="HalmanApp API", version="1.1.0")

# 3. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class RiasecScores(BaseModel):
    Realistic: int
    Investigative: int
    Artistic: int
    Social: int
    Enterprising: int
    Conventional: int

# --- ROUTES ---
@app.get("/")
def read_root():
    return {"status": "HalmanApp API is online and healthy."}

@app.get("/api/assessment-cards", response_model=List[AssessmentCardResponse])
def get_assessment_cards(db = Depends(get_db)):
    """Fetches the 24 RIASEC cards from Supabase."""
    try:
        response = db.table("assessment_cards").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/analyze-profile")
def analyze_profile(scores: RiasecScores):
    """Determines dominant trait and calls Gemini 3 for insights."""
    if not GEMINI_API_KEY or client is None:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")

    scores_dict = scores.model_dump()
    dominant_trait = max(scores_dict, key=scores_dict.get)

    # Prompt engineered for 2026 LLM standards
    prompt = f"""
    Role: Halman affandi, a fun, witty career counselor for kids aged 11-15.
    Context: A student finished a RIASEC test. Their top trait is '{dominant_trait}'.
    Task: Tell them their 'superpower' in 2 engaging, short sentences in Arabic. 
    Constraint: Direct address, no markdown, high energy.
    """

    try:
        # Call the high-performance Gemini 3 Flash Preview
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt,
        )
        
        return {
            "dominant_trait": dominant_trait,
            "ai_insight": response.text.strip(),
            "raw_scores": scores_dict
        }
    except Exception as e:
        print(f"AI Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Engine failed: {str(e)}")