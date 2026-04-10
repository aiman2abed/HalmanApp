import os
import re
import json
import uuid
import base64
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv
import jwt

from database import get_db
from models import AssessmentCardResponse

# ==========================================
# 1. ENVIRONMENT & CONFIGURATION
# ==========================================
load_dotenv(override=True)
raw_key = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_KEY = raw_key.replace('"', "").replace("'", "").strip()

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="HalmanApp API", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAT_MODEL = "gemini-3.1-flash-lite-preview"
LIVE_MODEL = os.getenv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview")
MAX_RECENT_HISTORY = 8
LIVE_SESSION_TTL_MINUTES = 30
live_sessions: Dict[str, datetime] = {}


# ==========================================
# 2. DATA MODELS
# ==========================================
class RiasecScores(BaseModel):
    Realistic: int
    Investigative: int
    Artistic: int
    Social: int
    Enterprising: int
    Conventional: int

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    user_message: str
    student_name: str
    dominant_trait: str = "غير محدد"
    history: List[ChatMessage] = Field(default_factory=list)

class ContentBlock(BaseModel):
    type: Literal["title", "paragraph", "code", "list"]
    text: str = ""
    language: Optional[str] = None
    items: List[str] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    blocks: List[ContentBlock] = Field(default_factory=list)

class TranscriptionResponse(BaseModel):
    transcript: str

class LiveSessionResponse(BaseModel):
    status: Literal["ready_for_transport"]
    message: str
    session_id: str
    websocket_path: str
    live_ai_connected: bool

class AnalysisSection(BaseModel):
    title: str
    points: List[str] = Field(default_factory=list)

class AnalysisMetric(BaseModel):
    label: str
    score: int = Field(ge=0, le=100)
    note: str = ""

class AnalysisResponse(BaseModel):
    title: str
    summary: str
    sections: List[AnalysisSection] = Field(default_factory=list)
    metrics: List[AnalysisMetric] = Field(default_factory=list)
    tips: List[str] = Field(default_factory=list)
    hints: List[str] = Field(default_factory=list)
    availability_notes: List[str] = Field(default_factory=list)

class LiveSessionAnalysisRequest(BaseModel):
    transcript: str
    context_notes: Optional[str] = ""

class LiveSessionBootstrapResponse(BaseModel):
    connected: bool
    session_id: str
    message: str

# الـ Model الجديد الخاص بالأسئلة التكيفية
class AdaptiveRequest(BaseModel):
    current_scores: Dict[str, int]

# ==========================================
# 3. HELPERS
# ==========================================
def require_gemini_client():
    if not GEMINI_API_KEY or client is None:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")

def create_live_session_context() -> str:
    session_id = str(uuid.uuid4())
    live_sessions[session_id] = datetime.now(timezone.utc)
    return session_id

def prune_expired_live_sessions() -> None:
    now = datetime.now(timezone.utc)
    expired = [
        sid for sid, created_at in live_sessions.items()
        if now - created_at > timedelta(minutes=LIVE_SESSION_TTL_MINUTES)
    ]
    for sid in expired:
        live_sessions.pop(sid, None)

def pop_live_session_context(session_id: str) -> bool:
    return live_sessions.pop(session_id, None) is not None

def normalize_history_role(role: str) -> str:
    role = (role or "").strip().lower()
    if role in {"user", "model"}:
        return role
    return "user"

def get_recent_history(history: List[ChatMessage], limit: int = MAX_RECENT_HISTORY) -> List[ChatMessage]:
    return history[-limit:] if history else []

def classify_input_style(user_message: str) -> str:
    msg = user_message.strip()
    word_count = len(msg.split())
    if word_count <= 2: return "very_short"
    if any(token in msg for token in ["؟", "?", "ليش", "كيف", "شو", "متى", "وين", "هل"]): return "question"
    if any(token in msg for token in ["زعلان", "مضايق", "خايف", "متوتر", "تعبان", "طفشان"]): return "emotional"
    return "normal"

def build_system_instruction(student_name: str, dominant_trait: str, input_style: str) -> str:
    length_rule = {
        "very_short": "إذا كانت رسالة الطالب قصيرة جداً، اجعل الرد قصيراً جداً.",
        "question": "إذا سأل الطالب سؤالاً واضحاً، أجب مباشرة وببساطة قبل أي سؤال متابعة.",
        "emotional": "إذا بدا الطالب متضايقاً أو قلقاً، كن أهدأ وأكثر احتواءً وطمأنة.",
        "normal": "اجعل الرد مختصراً ومفيداً، ويمكنك إضافة سؤال متابعة واحد فقط عند الحاجة.",
    }.get(input_style, "اجعل الرد مختصراً ومفيداً.")

    return f"""
أنت "حلمان أفندي"، مساعد ذكي وودود وآمن للأطفال والطلاب.
اسم الطالب: "{student_name}"
الصفة/السمة الغالبة: "{dominant_trait}"

الأسلوب:
- لطيف، طبيعي، داعم، ومناسب للعمر.
- تتكلم بالعربية البسيطة والواضحة.
- لا تبالغ في الحماس.
- أعطِ فائدة حقيقية بسرعة.

قاعدة الطول:
{length_rule}

تعليمات الإخراج:
أنت يجب أن تُرجع JSON صالح فقط، بدون أي نص خارج JSON.
صيغة JSON المطلوبة:
{{
  "reply": "نسخة نصية مختصرة ومقروءة للرد",
  "blocks": []
}}
"""

def clean_text(text: str) -> str:
    if not text: return ""
    text = re.sub(r"\n{2,}", "\n", text).strip()
    text = text.replace('يا "man"', "يا صاحبي")
    return text

def parse_json_object(raw_text: str) -> Optional[dict]:
    cleaned = clean_text(raw_text)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass
    json_match = re.search(r"\{[\s\S]*\}", cleaned)
    if not json_match: return None
    try:
        parsed = json.loads(json_match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None

# ==========================================
# 4. API ENDPOINTS
# ==========================================
@app.get("/")
def read_root():
    return {"status": "HalmanApp API is online and healthy."}

@app.get("/api/assessment-cards", response_model=List[AssessmentCardResponse])
def get_assessment_cards(db=Depends(get_db)):
    try:
        response = db.table("assessment_cards").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/analyze-profile")
def analyze_profile(scores: RiasecScores):
    require_gemini_client()
    scores_dict = scores.model_dump()
    dominant_trait = max(scores_dict, key=scores_dict.get)
    prompt = f"""
أنت "حلمان أفندي"، مساعد لطيف وملهم للطلاب بعمر 11-15.
الطالب أنهى اختبار RIASEC، وصفته الغالبة هي: "{dominant_trait}".
اكتب سطرين قصيرين فقط بالعربية، مشجعين وواضحين وبدون مبالغة.
"""
    try:
        response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
        insight = clean_text((response.text or "").strip())
        return {
            "dominant_trait": dominant_trait,
            "ai_insight": insight,
            "raw_scores": scores_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine failed: {str(e)}")

# الـ Endpoint الجديد الخاص بالأسئلة التكيفية
@app.post("/api/adaptive-questions")
def generate_adaptive_questions(req: AdaptiveRequest):
    require_gemini_client()
    
    # استخراج أعلى سمتين للمقارنة بينهما
    sorted_traits = sorted(req.current_scores.items(), key=lambda x: x[1], reverse=True)
    top_traits = [t[0] for t in sorted_traits[:2]]
    
    prompt = f"""
    الطالب حصل على نتائج متقاربة في سمات: {", ".join(top_traits)}.
    اقترح 3 أسئلة قصيرة جداً باللغة العربية (إجابتها نعم/لا) لمساعدتي في تحديد أيهما الأنسب له.
    
    يجب أن يكون الرد JSON فقط بهذا التنسيق وبدون أي نصوص إضافية:
    {{
      "newCards": [
        {{"id": "a1", "prompt_text": "سؤال محدد عن السمة الأولى", "primary_trait": "{top_traits[0]}"}},
        {{"id": "a2", "prompt_text": "سؤال محدد عن السمة الثانية", "primary_trait": "{top_traits[1]}"}},
        {{"id": "a3", "prompt_text": "سؤال يجمع بينهما أو يفصل بينهما", "primary_trait": "{top_traits[0]}"}}
      ]
    }}
    """
    
    try:
        response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
        parsed = parse_json_object(response.text)
        return parsed if parsed else {"newCards": []}
    except Exception as e:
        print(f"Adaptive Error: {e}")
        return {"newCards": []}


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_halman(request: ChatRequest):
    require_gemini_client()

    # 1. Analyze input style to adjust Halman's tone
    input_style = classify_input_style(request.user_message)

    # 2. Build the dynamic system instruction
    sys_instruct = build_system_instruction(
        student_name=request.student_name,
        dominant_trait=request.dominant_trait,
        input_style=input_style
    )

    # 3. Format recent history for the Gemini SDK
    recent_history = get_recent_history(request.history)
    contents = []
    
    for msg in recent_history:
        role = "user" if msg.role == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))

    # Append the current user message
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.user_message)]))

    try:
        # 4. Call the Gemini model
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruct,
                temperature=0.7,
                # Force the model to return JSON to match your frontend expectations
                response_mime_type="application/json" 
            )
        )

        # 5. Parse and validate the JSON response
        parsed_data = parse_json_object(response.text)

        # Fallback if the AI didn't return proper JSON
        if not parsed_data or "reply" not in parsed_data:
            return ChatResponse(
                reply="عذراً، صار عندي مشكلة صغيرة في ترتيب أفكاري. ممكن تعيد سؤالك؟",
                blocks=[]
            )

        # 6. Return the clean data to the frontend
        return ChatResponse(
            reply=parsed_data.get("reply", ""),
            blocks=parsed_data.get("blocks", [])
        )

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="فشل الاتصال بالذكاء الاصطناعي")
    
@app.get("/api/discover/videos")
def get_discover_videos(skip: int = 0, limit: int = 3):
    return {"videos": [], "has_next": False, "total": 0}

# ==========================================
# 5. SECURE RBAC & ADMIN ENDPOINTS
# ==========================================
def verify_supabase_token(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        if not user_id: raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def verify_app_developer(user_id: str):
    db = get_db()
    res = db.table("user_role_assignments").select("*").eq("user_id", user_id).eq("role", "app_developer").execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=403, detail="Forbidden")

class RoleAssignmentRequest(BaseModel):
    target_user_id: str
    role: str
    scope_type: str
    scope_id: Optional[str] = None

@app.get("/api/developer/users")
def get_all_system_users(user_id: str = Depends(verify_supabase_token)):
    verify_app_developer(user_id)
    db = get_db()
    try:
        users_res = db.table("users").select("*").execute()
        roles_res = db.table("user_role_assignments").select("*").execute()
        merged_users = []
        for u in users_res.data:
            user_roles = [r for r in roles_res.data if r['user_id'] == u['id']]
            merged_users.append({
                "id": u['id'], "name": u.get('display_name', 'بدون اسم'), "email": "مخفي", "roles": user_roles
            })
        return {"users": merged_users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/developer/assign-role")
def assign_user_role(req: RoleAssignmentRequest, user_id: str = Depends(verify_supabase_token)):
    verify_app_developer(user_id)
    db = get_db()
    try:
        data = {"user_id": req.target_user_id, "role": req.role, "scope_type": req.scope_type, "scope_id": req.scope_id if req.scope_id else None}
        res = db.table("user_role_assignments").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))