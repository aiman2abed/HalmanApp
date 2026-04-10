import re
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException
from config import client, GEMINI_API_KEY, LIVE_SESSION_TTL_MINUTES, MAX_RECENT_HISTORY
from schemas import ChatMessage

live_sessions = {}

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