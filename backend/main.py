import os
import re
import json
import base64
from typing import Any, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from dotenv import load_dotenv

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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHAT_MODEL = "gemini-3.1-flash-lite-preview"
MAX_RECENT_HISTORY = 8


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
    status: Literal["scaffolded"]
    message: str


# ==========================================
# 3. HELPERS
# ==========================================
def require_gemini_client():
    if not GEMINI_API_KEY or client is None:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")


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

    if word_count <= 2:
        return "very_short"

    if any(token in msg for token in ["؟", "?", "ليش", "كيف", "شو", "متى", "وين", "هل"]):
        return "question"

    if any(token in msg for token in ["زعلان", "مضايق", "خايف", "متوتر", "تعبان", "طفشان"]):
        return "emotional"

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
- لا تكرر الترحيب في كل رسالة.
- لا تكرر كلمات مثل "يا بطل" و"يا مستكشف" كثيراً.
- أعطِ فائدة حقيقية بسرعة.
- إذا كان المطلوب شرحاً، نظّم الجواب بشكل واضح.
- إذا احتاج الأمر، يمكنك استخدام عنوان قصير ثم فقرات قصيرة.
- إذا طلب المستخدم كوداً أو شرحاً برمجياً، يمكنك إرجاع code block واضح.
- إذا كان الرد مجرد محادثة قصيرة، لا تحوله إلى مقال.

قاعدة الطول:
{length_rule}

تعليمات الإخراج:
أنت يجب أن تُرجع JSON صالح فقط، بدون أي نص خارج JSON.
صيغة JSON المطلوبة:
{{
  "reply": "نسخة نصية مختصرة ومقروءة للرد",
  "blocks": [
    {{
      "type": "title",
      "text": "عنوان قصير"
    }},
    {{
      "type": "paragraph",
      "text": "فقرة قصيرة وواضحة"
    }},
    {{
      "type": "list",
      "items": ["عنصر 1", "عنصر 2"]
    }},
    {{
      "type": "code",
      "language": "python",
      "text": "print('hello')"
    }}
  ]
}}

قواعد مهمة جداً:
- لا تستخدم markdown fences مثل ```json أو ```python
- لا تضف أي شرح خارج JSON
- إذا لم يحتج الرد عنواناً أو كوداً أو قائمة، أعد فقط blocks بسيطة مناسبة
- يجب أن يكون JSON صالحاً وقابلاً للتحليل
"""


def build_style_examples() -> List[dict]:
    return [
        {"role": "user", "parts": [{"text": 'المستخدم: كيفك'}]},
        {"role": "model", "parts": [{"text": '{"reply":"أنا تمام 😊 وجاهز أساعدك. إنت كيفك؟","blocks":[{"type":"paragraph","text":"أنا تمام 😊 وجاهز أساعدك. إنت كيفك؟"}]}'}]},

        {"role": "user", "parts": [{"text": 'المستخدم: الحاسوب'}]},
        {"role": "model", "parts": [{"text": '{"reply":"الحاسوب جهاز بيعالج المعلومات وينفذ الأوامر 💻 بدك أشرحلك مكوّناته ولا كيف بيشتغل؟","blocks":[{"type":"title","text":"الحاسوب"},{"type":"paragraph","text":"الحاسوب جهاز بيعالج المعلومات وينفذ الأوامر 💻"},{"type":"paragraph","text":"بدك أشرحلك مكوّناته ولا كيف بيشتغل؟"}]}'}]},
    ]


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\n{2,}", "\n", text).strip()
    text = text.replace('يا "man"', "يا صاحبي")
    text = text.replace('يا "Man"', "يا صاحبي")
    return text


def fallback_blocks_from_text(text: str) -> List[ContentBlock]:
    cleaned = clean_text(text)
    if not cleaned:
        return [ContentBlock(type="paragraph", text="أكيد، أنا معك. احكيلي شو بدك نبدأ فيه.")]

    paragraphs = [p.strip() for p in cleaned.split("\n") if p.strip()]
    return [ContentBlock(type="paragraph", text=p) for p in paragraphs]


def parse_json_response(raw_text: str) -> Optional[dict]:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Robust fallback: sometimes models wrap JSON in extra text.
    json_match = re.search(r"\{[\s\S]*\}", raw_text)
    if not json_match:
        return None

    try:
        return json.loads(json_match.group(0))
    except json.JSONDecodeError:
        return None


def normalize_content_blocks(raw_blocks: Any) -> List[ContentBlock]:
    if not isinstance(raw_blocks, list):
        return []

    blocks: List[ContentBlock] = []
    for block in raw_blocks:
        if not isinstance(block, dict):
            continue

        block_type = str(block.get("type", "paragraph")).strip().lower()
        text = clean_text(str(block.get("text", "")))

        if block_type == "list":
            raw_items = block.get("items", [])
            items = [clean_text(str(item)) for item in raw_items if str(item).strip()]
            if items or text:
                blocks.append(ContentBlock(type="list", text=text, items=items))
        elif block_type == "code":
            blocks.append(
                ContentBlock(
                    type="code",
                    text=text,
                    language=clean_text(str(block.get("language", ""))) or None
                )
            )
        elif block_type == "title":
            if text:
                blocks.append(ContentBlock(type="title", text=text))
        else:
            if text:
                blocks.append(ContentBlock(type="paragraph", text=text))

    return blocks


def parse_model_response(raw_text: str) -> ChatResponse:
    cleaned = clean_text(raw_text)
    parsed = parse_json_response(cleaned)
    if not isinstance(parsed, dict):
        fallback_reply = cleaned or "أكيد، أنا معك. احكيلي شو بدك نبدأ فيه."
        return ChatResponse(reply=fallback_reply, blocks=fallback_blocks_from_text(fallback_reply))

    reply = clean_text(str(parsed.get("reply", "")))
    blocks = normalize_content_blocks(parsed.get("blocks", []))

    if not blocks:
        blocks = fallback_blocks_from_text(reply)

    if not reply:
        reply = " ".join([b.text for b in blocks if b.type in {"title", "paragraph"} and b.text]).strip()
    if not reply:
        reply = "أكيد، أنا معك. احكيلي شو بدك نبدأ فيه."

    return ChatResponse(reply=reply, blocks=blocks)


def generate_chat_reply(request: ChatRequest) -> ChatResponse:
    input_style = classify_input_style(request.user_message)
    system_instruction = build_system_instruction(
        student_name=request.student_name,
        dominant_trait=request.dominant_trait,
        input_style=input_style,
    )

    recent_history = get_recent_history(request.history)
    contents = []

    contents.append({
        "role": "user",
        "parts": [{"text": f"تعليمات النظام:\n{system_instruction}"}]
    })
    contents.append({
        "role": "model",
        "parts": [{"text": "تم. سألتزم بهذا الأسلوب وسأعيد JSON صالح فقط."}]
    })

    contents.extend(build_style_examples())

    for msg in recent_history:
        normalized_role = normalize_history_role(msg.role)
        contents.append({
            "role": normalized_role,
            "parts": [{"text": msg.text.strip()}]
        })

    contents.append({
        "role": "user",
        "parts": [{"text": request.user_message.strip()}]
    })

    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=contents,
    )

    reply_text = getattr(response, "text", None) or ""
    return parse_model_response(reply_text)


def transcribe_audio_bytes(audio_bytes: bytes, mime_type: str) -> str:
    prompt = (
        "حوّل هذا الصوت إلى نص عربي واضح. "
        "أرجع النص المنطوق فقط بدون مقدمات أو شروحات."
    )

    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64.b64encode(audio_bytes).decode("utf-8"),
                        }
                    },
                ],
            }
        ],
    )

    return clean_text(getattr(response, "text", "") or "")


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

اكتب سطرين قصيرين فقط بالعربية:
- مشجعين
- واضحين
- طبيعيين
- بدون مبالغة
"""

    try:
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=prompt,
        )
        insight = clean_text((response.text or "").strip())
        return {
            "dominant_trait": dominant_trait,
            "ai_insight": insight,
            "raw_scores": scores_dict
        }
    except Exception as e:
        print(f"AI Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Engine failed: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_halman(request: ChatRequest):
    require_gemini_client()

    try:
        return generate_chat_reply(request)
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Chat failed: {str(e)}")


@app.post("/api/transcribe-audio", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    require_gemini_client()

    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file.")

        mime_type = (file.content_type or "audio/webm").strip()
        if not mime_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be audio.")

        transcript = transcribe_audio_bytes(audio_bytes=audio_bytes, mime_type=mime_type)
        if not transcript:
            raise HTTPException(status_code=422, detail="No speech detected in audio.")

        return TranscriptionResponse(transcript=transcript)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Audio Transcription Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")


@app.post("/api/live/session", response_model=LiveSessionResponse)
def create_live_session_scaffold():
    # TODO: Replace with Gemini Live API session creation and WS credentials.
    return LiveSessionResponse(
        status="scaffolded",
        message="Live mode backend scaffold is ready. Streaming integration is pending.",
    )
