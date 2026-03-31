import os
import re
import json
import uuid
import base64
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
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

logger = logging.getLogger("halman.live")

app = FastAPI(title="HalmanApp API", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


def parse_json_object(raw_text: str) -> Optional[dict]:
    cleaned = clean_text(raw_text)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    json_match = re.search(r"\{[\s\S]*\}", cleaned)
    if not json_match:
        return None

    try:
        parsed = json.loads(json_match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def normalize_analysis_response(raw: Optional[dict], fallback_title: str) -> AnalysisResponse:
    if not isinstance(raw, dict):
        return AnalysisResponse(
            title=fallback_title,
            summary="تم التحليل بنجاح، لكن تنسيق النتيجة كان غير مكتمل. جرّب مرة ثانية للحصول على تفاصيل أكثر.",
            sections=[],
            metrics=[],
            tips=["قسّم الفكرة الرئيسية إلى نقاط قصيرة وواضحة."],
            hints=["تحليل الوقفة الجسدية غير متاح بالكامل حالياً وسيتم تحسينه لاحقاً."],
            availability_notes=["تم إرجاع نتيجة احتياطية بسبب تنسيق غير متوقع من النموذج."],
        )

    sections: List[AnalysisSection] = []
    for section in raw.get("sections", []):
        if not isinstance(section, dict):
            continue
        title = clean_text(str(section.get("title", "")))
        points = [clean_text(str(p)) for p in section.get("points", []) if clean_text(str(p))]
        if title and points:
            sections.append(AnalysisSection(title=title, points=points))

    metrics: List[AnalysisMetric] = []
    for metric in raw.get("metrics", []):
        if not isinstance(metric, dict):
            continue
        label = clean_text(str(metric.get("label", "")))
        try:
            score = int(metric.get("score", 0))
        except (TypeError, ValueError):
            score = 0
        note = clean_text(str(metric.get("note", "")))
        if label:
            metrics.append(AnalysisMetric(label=label, score=max(0, min(100, score)), note=note))

    tips = [clean_text(str(t)) for t in raw.get("tips", []) if clean_text(str(t))]
    hints = [clean_text(str(t)) for t in raw.get("hints", []) if clean_text(str(t))]
    availability_notes = [
        clean_text(str(t)) for t in raw.get("availability_notes", []) if clean_text(str(t))
    ]

    title = clean_text(str(raw.get("title", ""))) or fallback_title
    summary = clean_text(str(raw.get("summary", ""))) or "تم التحليل، وهذه أبرز النقاط العملية للتحسين."

    if not availability_notes:
        availability_notes = ["تحليل الوقفة الجسدية التفصيلي قيد التطوير وسيُربط بنموذج رؤية متخصص لاحقاً."]

    return AnalysisResponse(
        title=title,
        summary=summary,
        sections=sections,
        metrics=metrics,
        tips=tips,
        hints=hints,
        availability_notes=availability_notes,
    )


def analyze_media_bytes(media_bytes: bytes, mime_type: str, source_kind: str) -> AnalysisResponse:
    prompt = f"""
أنت "حلمان أفندي" وتعمل كمدرب أداء واضح وحازم بلطف.
حلل هذا المحتوى ({source_kind}) وأرجع JSON فقط.

القواعد:
- أسلوب عربي واضح، عملي، وداعم.
- كن حازماً بشكل لطيف: حدّد نقاط القوة ثم نقاط التحسين بوضوح.
- لا تدّعِ تحليلات غير متاحة.
- إذا كانت دقة تحليل الوقفة الجسدية محدودة، اذكر ذلك بوضوح في availability_notes.

أرجع JSON بهذا الشكل فقط:
{{
  "title": "عنوان قصير للتحليل",
  "summary": "ملخص مباشر",
  "sections": [
    {{"title":"الانطباع العام","points":["...","..."]}},
    {{"title":"نقاط القوة","points":["...","..."]}},
    {{"title":"مجالات التحسين","points":["...","..."]}},
    {{"title":"تحليل الوقفة والسياق","points":["...","..."]}}
  ],
  "metrics": [
    {{"label":"وضوح الفكرة","score":78,"note":"..."}},
    {{"label":"تنظيم الطرح","score":70,"note":"..."}},
    {{"label":"الإلقاء","score":74,"note":"..."}}
  ],
  "tips": ["...","...","..."],
  "hints": ["...","..."],
  "availability_notes": ["..."]
}}
"""

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
                            "data": base64.b64encode(media_bytes).decode("utf-8"),
                        }
                    },
                ],
            }
        ],
    )

    parsed = parse_json_object(getattr(response, "text", "") or "")
    return normalize_analysis_response(parsed, fallback_title="تحليل أداء حلمان أفندي")


def analyze_transcript_text(transcript: str, context_notes: str) -> AnalysisResponse:
    prompt = f"""
أنت "حلمان أفندي" وتعمل كمدرب عرض وتواصل.
حلل النص التالي بلهجة عربية فصيحة بسيطة، ثم أرجع JSON فقط.

النص:
{transcript}

ملاحظات سياق إضافية:
{context_notes or "لا توجد"}

التعليمات:
- كن واضحاً ومباشراً.
- أعطِ تحسينات قابلة للتطبيق فوراً.
- لا تدّعِ تحليل وقفة جسدية حقيقي من نص فقط.

أعد JSON بنفس الصيغة:
{{
  "title": "...",
  "summary": "...",
  "sections": [
    {{"title":"الانطباع العام","points":["..."]}},
    {{"title":"نقاط القوة","points":["..."]}},
    {{"title":"مجالات التحسين","points":["..."]}}
  ],
  "metrics": [
    {{"label":"وضوح الفكرة","score":0,"note":"..."}},
    {{"label":"تنظيم المحتوى","score":0,"note":"..."}},
    {{"label":"اللغة والإلقاء النصي","score":0,"note":"..."}}
  ],
  "tips": ["..."],
  "hints": ["..."],
  "availability_notes": ["تحليل الوقفة غير متاح من النص فقط."]
}}
"""

    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
    )

    parsed = parse_json_object(getattr(response, "text", "") or "")
    return normalize_analysis_response(parsed, fallback_title="تحليل نص الجلسة")


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
def create_live_session():
    require_gemini_client()
    prune_expired_live_sessions()
    session_id = create_live_session_context()
    return LiveSessionResponse(
        status="ready_for_transport",
        session_id=session_id,
        websocket_path=f"/api/live/ws/{session_id}",
        live_ai_connected=True,
        message="Gemini Live session is ready.",
    )


async def relay_live_responses(gemini_session: Any, browser_ws: WebSocket):
    assistant_speaking = False
    last_output_text = ""
    try:
        async for response in gemini_session.receive():
            server_content = getattr(response, "server_content", None)
            if not server_content:
                continue

            model_turn = getattr(server_content, "model_turn", None)
            if model_turn and getattr(model_turn, "parts", None):
                for part in model_turn.parts:
                    inline_data = getattr(part, "inline_data", None)
                    if not inline_data or not getattr(inline_data, "data", None):
                        continue

                    audio_bytes = inline_data.data
                    if isinstance(audio_bytes, str):
                        audio_b64 = audio_bytes
                    else:
                        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

                    if not assistant_speaking:
                        assistant_speaking = True
                        await browser_ws.send_json({"event": "assistant_speaking_start"})

                    await browser_ws.send_json(
                        {
                            "event": "audio_output_chunk",
                            "audio_base64": audio_b64,
                            "mime_type": getattr(inline_data, "mime_type", "audio/pcm;rate=24000"),
                        }
                    )

            input_tx = getattr(server_content, "input_transcription", None)
            if input_tx and getattr(input_tx, "text", None):
                await browser_ws.send_json({"event": "transcript_delta", "source": "user", "text": input_tx.text})

            output_tx = getattr(server_content, "output_transcription", None)
            if output_tx and getattr(output_tx, "text", None):
                last_output_text = output_tx.text
                await browser_ws.send_json({"event": "transcript_delta", "source": "assistant", "text": output_tx.text})

            if getattr(server_content, "turn_complete", False):
                if last_output_text:
                    await browser_ws.send_json({"event": "transcript_final", "source": "assistant", "text": last_output_text})
                    last_output_text = ""
                if assistant_speaking:
                    assistant_speaking = False
                    await browser_ws.send_json({"event": "assistant_speaking_stop"})
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("Gemini Live relay failed.")
        raise


@app.websocket("/api/live/ws/{session_id}")
async def live_session_websocket(session_id: str, websocket: WebSocket):
    await websocket.accept()
    if session_id not in live_sessions:
        await websocket.send_json({"event": "live_error", "message": "Live session is missing or expired."})
        await websocket.close(code=4404)
        return

    require_gemini_client()
    live_receive_task: Optional[asyncio.Task] = None
    try:
        # Use Gemini Live automatic turn handling as the only authority for voice turns.
        live_config = {
            "response_modalities": ["AUDIO"],
            "input_audio_transcription": {},
            "output_audio_transcription": {},
        }

        async with client.aio.live.connect(model=LIVE_MODEL, config=live_config) as gemini_live_session:
            await websocket.send_json(
                LiveSessionBootstrapResponse(
                    connected=True,
                    session_id=session_id,
                    message="Gemini Live WebSocket connected.",
                ).model_dump()
            )
            await websocket.send_json({"event": "session_ready", "session_id": session_id})

            live_receive_task = asyncio.create_task(relay_live_responses(gemini_live_session, websocket))

            while True:
                payload: Dict[str, Any] = await websocket.receive_json()
                event = clean_text(str(payload.get("event", "")))

                if event == "ping":
                    await websocket.send_json({"event": "pong"})
                    continue

                if event == "disconnect":
                    break

                if event == "audio_input_chunk":
                    audio_b64 = str(payload.get("audio_base64", "")).strip()
                    mime_type = str(payload.get("mime_type", "audio/pcm;rate=16000")).strip() or "audio/pcm;rate=16000"
                    if not audio_b64:
                        continue
                    try:
                        chunk = base64.b64decode(audio_b64, validate=True)
                    except Exception:
                        await websocket.send_json({"event": "live_error", "message": "Invalid audio chunk encoding."})
                        continue
                    await gemini_live_session.send_realtime_input(
                        audio=types.Blob(data=chunk, mime_type=mime_type)
                    )
                    continue

                if event in {"activity_start", "activity_end"}:
                    logger.info("Ignoring legacy live event '%s' for session %s.", event, session_id)
                    continue

                if event == "text_input":
                    text = str(payload.get("text", "")).strip()
                    if text:
                        await gemini_live_session.send_realtime_input(text=text)
                    continue

                logger.debug("Ignoring unsupported live event '%s' for session %s.", event, session_id)
    except WebSocketDisconnect as ws_disconnect:
        logger.info("Browser WebSocket disconnected for live session %s: %s", session_id, ws_disconnect)
    except Exception as e:
        logger.exception("Gemini Live bridge error for session %s.", session_id)
        try:
            await websocket.send_json({"event": "live_error", "message": f"Gemini Live bridge error: {str(e)}"})
        except Exception:
            pass
    finally:
        if live_receive_task:
            live_receive_task.cancel()
            try:
                await live_receive_task
            except asyncio.CancelledError:
                pass
            except Exception:
                pass
        pop_live_session_context(session_id)
        try:
            await websocket.send_json({"event": "session_closed", "session_id": session_id})
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass


@app.post("/api/analyze-audio", response_model=AnalysisResponse)
async def analyze_audio(file: UploadFile = File(...)):
    require_gemini_client()
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    mime_type = (file.content_type or "").strip()
    if not mime_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be audio.")

    try:
        return analyze_media_bytes(audio_bytes, mime_type, source_kind="ملف صوتي")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")


@app.post("/api/analyze-video", response_model=AnalysisResponse)
async def analyze_video(file: UploadFile = File(...)):
    require_gemini_client()
    video_bytes = await file.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Empty video file.")

    mime_type = (file.content_type or "").strip()
    if not mime_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be video.")

    try:
        return analyze_media_bytes(video_bytes, mime_type, source_kind="ملف فيديو")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video analysis failed: {str(e)}")


@app.post("/api/analyze-live-session", response_model=AnalysisResponse)
def analyze_live_session(request: LiveSessionAnalysisRequest):
    require_gemini_client()
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required.")
    try:
        return analyze_transcript_text(
            transcript=request.transcript.strip(),
            context_notes=(request.context_notes or "").strip(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live session analysis failed: {str(e)}")
