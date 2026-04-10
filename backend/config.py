import os
from dotenv import load_dotenv
from google import genai

load_dotenv(override=True)

raw_key = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_KEY = raw_key.replace('"', "").replace("'", "").strip()

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

CHAT_MODEL = "gemini-3.1-flash-lite-preview"
LIVE_MODEL = os.getenv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview")
MAX_RECENT_HISTORY = 8
LIVE_SESSION_TTL_MINUTES = 30