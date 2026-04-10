from fastapi import APIRouter, HTTPException, Depends
from typing import List
from google.genai import types

from database import get_db
from config import client, CHAT_MODEL
from schemas import (
    AssessmentCardResponse, RiasecScores, AdaptiveRequest, 
    ChatRequest, ChatResponse, RoleAssignmentRequest
)
from utils import (
    require_gemini_client, clean_text, parse_json_object, 
    classify_input_style, build_system_instruction, get_recent_history
)
from auth import verify_supabase_token, verify_app_developer

router = APIRouter(prefix="/api")

@router.get("/assessment-cards", response_model=List[AssessmentCardResponse])
def get_assessment_cards(db=Depends(get_db)):
    try:
        response = db.table("assessment_cards").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/analyze-profile")
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

@router.post("/adaptive-questions")
def generate_adaptive_questions(req: AdaptiveRequest):
    require_gemini_client()
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

@router.post("/chat", response_model=ChatResponse)
def chat_with_halman(request: ChatRequest):
    require_gemini_client()
    input_style = classify_input_style(request.user_message)
    sys_instruct = build_system_instruction(
        student_name=request.student_name,
        dominant_trait=request.dominant_trait,
        input_style=input_style
    )

    recent_history = get_recent_history(request.history)
    contents = []
    
    for msg in recent_history:
        role = "user" if msg.role == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))

    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=request.user_message)]))

    try:
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=sys_instruct,
                temperature=0.7,
                response_mime_type="application/json" 
            )
        )

        parsed_data = parse_json_object(response.text)
        if not parsed_data or "reply" not in parsed_data:
            return ChatResponse(
                reply="عذراً، صار عندي مشكلة صغيرة في ترتيب أفكاري. ممكن تعيد سؤالك؟",
                blocks=[]
            )

        return ChatResponse(
            reply=parsed_data.get("reply", ""),
            blocks=parsed_data.get("blocks", [])
        )
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="فشل الاتصال بالذكاء الاصطناعي")
    
@router.get("/discover/videos")
def get_discover_videos(skip: int = 0, limit: int = 3):
    return {"videos": [], "has_next": False, "total": 0}

@router.get("/developer/users")
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

@router.post("/developer/assign-role")
def assign_user_role(req: RoleAssignmentRequest, user_id: str = Depends(verify_supabase_token)):
    verify_app_developer(user_id)
    db = get_db()
    try:
        data = {"user_id": req.target_user_id, "role": req.role, "scope_type": req.scope_type, "scope_id": req.scope_id if req.scope_id else None}
        res = db.table("user_role_assignments").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))