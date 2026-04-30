# /Users/aimanabed/Desktop/Halman/HalmanApp/backend/routers.py
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from google.genai import types

from database import get_db
from config import client, CHAT_MODEL

# Import all data models from schemas
from schemas import (
    AssessmentCardResponse, RiasecScores, AdaptiveRequest, 
    ChatRequest, ChatResponse, RoleAssignmentRequest,
    CMSVideoCreate, VideoActionRequest,
    SuggestionCreate, SuggestionUpdate
)

# Import all security functions from utils & auth
from utils import (
    require_gemini_client, clean_text, parse_json_object, 
    classify_input_style, build_system_instruction, get_recent_history
)
from auth import verify_supabase_token, verify_app_developer, verify_content_manager

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
أنت "حلمان أفندي"، مساعد لطيف وملهم للطلاب بعمر 7-15.
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

        # --- THE FIX: Clean up AI schema hallucinations ---
        raw_blocks = parsed_data.get("blocks", [])
        valid_blocks = []
        for block in raw_blocks:
            b_type = block.get("type", "paragraph")
            # If the AI says "text" or invents a new type, force it to "paragraph"
            if b_type not in ["title", "paragraph", "code", "list"]:
                block["type"] = "paragraph"
            valid_blocks.append(block)
        # ------------------------------------------------

        return ChatResponse(
            reply=parsed_data.get("reply", ""),
            blocks=valid_blocks
        )
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="فشل الاتصال بالذكاء الاصطناعي")

    
@router.get("/discover/videos")
def get_discover_videos(skip: int = 0, limit: int = 3, db=Depends(get_db)):
    try:
        # Fetch from the database with pagination (.range)
        response = db.table("discover_videos").select("*").range(skip, skip + limit - 1).execute()
        
        videos = response.data
        
        # Check if there are more videos available to keep the infinite scroll alive
        has_next = len(videos) == limit
        
        # Format the response to match the camelCase expectations of your React frontend
        formatted_videos = []
        for v in videos:
            formatted_videos.append({
                "id": str(v["id"]),
                "videoUrl": v["video_url"],
                "title": v["title"],
                "description": v["description"],
                "hashtag": v["hashtag"]
            })
            
        return {
            "videos": formatted_videos,
            "has_next": has_next,
            "total": len(formatted_videos) 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/discover/like")
def toggle_like_video(req: VideoActionRequest, user_id: str = Depends(verify_supabase_token)):
    db = get_db()
    try:
        # Check if the like already exists
        existing = db.table("video_likes").select("*").eq("user_id", user_id).eq("video_id", req.video_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # If it exists, user is un-liking the video
            db.table("video_likes").delete().eq("user_id", user_id).eq("video_id", req.video_id).execute()
            return {"status": "success", "action": "unliked"}
        else:
            # If it doesn't exist, add a new like
            db.table("video_likes").insert({"user_id": user_id, "video_id": req.video_id}).execute()
            return {"status": "success", "action": "liked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discover/save")
def toggle_save_video(req: VideoActionRequest, user_id: str = Depends(verify_supabase_token)):
    db = get_db()
    try:
        # Check if the save already exists
        existing = db.table("video_saves").select("*").eq("user_id", user_id).eq("video_id", req.video_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # If it exists, user is un-saving the video
            db.table("video_saves").delete().eq("user_id", user_id).eq("video_id", req.video_id).execute()
            return {"status": "success", "action": "unsaved"}
        else:
            # If it doesn't exist, add a new save
            db.table("video_saves").insert({"user_id": user_id, "video_id": req.video_id}).execute()
            return {"status": "success", "action": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discover/watch")
def record_video_watch(req: VideoActionRequest, user_id: str = Depends(verify_supabase_token)):
    db = get_db()
    try:
        # 1. Check if user already earned XP for this video
        existing = db.table("video_views").select("*").eq("user_id", user_id).eq("video_id", req.video_id).execute()
        
        if existing.data and len(existing.data) > 0:
            return {"status": "already_earned", "message": "XP already granted for this video"}

        # 2. Record the view
        db.table("video_views").insert({"user_id": user_id, "video_id": req.video_id, "earned_xp": 15}).execute()

        # 3. Fetch current user XP to calculate new level
        user_data = db.table("users").select("total_xp").eq("id", user_id).single().execute()
        current_xp = user_data.data.get("total_xp", 0)
        new_xp = current_xp + 15
        
        # Simple Leveling Logic: 100 XP per level
        new_level = (new_xp // 100) + 1

        # 4. Update the user record
        db.table("users").update({
            "total_xp": new_xp,
            "current_level": new_level
        }).eq("id", user_id).execute()

        return {
            "status": "success", 
            "xp_earned": 15, 
            "new_total_xp": new_xp, 
            "new_level": new_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    
# ==========================================
# 6. CMS ENDPOINTS
# ==========================================
@router.post("/cms/videos")
def create_discover_video(video: CMSVideoCreate, user_id: str = Depends(verify_supabase_token)):
    verify_content_manager(user_id)
    db = get_db()
    try:
        data = {
            "title": video.title,
            "description": video.description,
            "hashtag": video.hashtag,
            "video_url": video.video_url
        }
        res = db.table("discover_videos").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cms/videos/{video_id}")
def delete_discover_video(video_id: str, user_id: str = Depends(verify_supabase_token)):
    verify_content_manager(user_id)
    db = get_db()
    try:
        res = db.table("discover_videos").delete().eq("id", video_id).execute()
        return {"status": "success", "message": "Video deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ==========================================
# DASHBOARD DATA ENDPOINTS
# ==========================================
@router.get("/teacher/students")
def get_teacher_students(user_id: str = Depends(verify_supabase_token)):
    db = get_db()
    try:
        # 1. For now, fetch all users who have the 'student' role
        roles = db.table("user_role_assignments").select("user_id").eq("role", "student").execute()
        student_ids = [r["user_id"] for r in roles.data]

        if not student_ids:
            return {"students": []}

        # 2. Get their core profiles
        users = db.table("users").select("id, display_name").in_("id", student_ids).execute()
        
        # 3. Get their progress stats
        progress = db.table("student_progress").select("*").in_("student_id", student_ids).execute()

        # Merge data into a clean list for the frontend
        merged = []
        for u in users.data:
            prog = next((p for p in progress.data if p["student_id"] == u["id"]), {})
            merged.append({
                "id": u["id"],
                "name": u.get("display_name") or "طالب بدون اسم",
                "level": prog.get("current_level", 1),
                "xp": prog.get("xp", 0),
                "track": prog.get("space_id", "عام"),
                "progress": prog.get("progress_percent", 0),
                "status": prog.get("status", "نشط")
            })
        return {"students": merged}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/family/children")
def get_family_children(user_id: str = Depends(verify_supabase_token)):
    db = get_db()
    try:
        # 1. Find children explicitly linked to this parent
        links = db.table("parent_student_links").select("student_id").eq("parent_id", user_id).execute()
        child_ids = [l["student_id"] for l in links.data]

        if not child_ids:
            return {"children": []}

        # 2. Get their core profiles
        users = db.table("users").select("id, display_name").in_("id", child_ids).execute()
        
        # 3. Get their progress stats
        progress = db.table("student_progress").select("*").in_("student_id", child_ids).execute()

        # Merge data
        merged = []
        for u in users.data:
            prog = next((p for p in progress.data if p["student_id"] == u["id"]), {})
            current_level = prog.get("current_level", 1)
            merged.append({
                "id": u["id"],
                "name": u.get("display_name") or "طالب",
                "level": current_level,
                "xp": prog.get("xp", 0),
                "nextLevelXp": current_level * 100 + 100, # Dynamic mock logic for the next level threshold
                "track": prog.get("space_id", "عام"),
                "recentTeacherNote": prog.get("recent_note", ""),
                "noteAuthor": prog.get("note_author", ""),
                "badges": ["مستكشف جديد"] # Default badge
            })
        return {"children": merged}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ==========================================
# ADMIN WORKFLOW ENDPOINTS
# ==========================================
@router.post("/suggestions")
def create_suggestion(req: SuggestionCreate, user_id: str = Depends(verify_supabase_token)):
    # Any teacher can submit a suggestion
    db = get_db()
    try:
        data = {
            "author_id": user_id,
            "student_id": req.student_id,
            "type": req.type,
            "description": req.description,
            "status": "pending"
        }
        res = db.table("content_suggestions").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/suggestions")
def get_admin_suggestions(user_id: str = Depends(verify_supabase_token)):
    # Make sure this user is a school_admin or app_developer
    db = get_db()
    
    roles = db.table("user_role_assignments").select("role").eq("user_id", user_id).execute()
    user_roles = [r["role"] for r in roles.data]
    if not ("school_admin" in user_roles or "app_developer" in user_roles):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")

    try:
        # 1. Fetch pending suggestions (Without complex JOINs)
        sugs = db.table("content_suggestions").select("*").eq("status", "pending").order("created_at", desc=True).execute()
        
        if not sugs.data:
            return {"suggestions": []}

        # 2. Fetch the authors separately to avoid PostgREST foreign key ambiguity
        author_ids = list(set([s["author_id"] for s in sugs.data if s.get("author_id")]))
        authors_res = db.table("users").select("id, display_name").in_("id", author_ids).execute()
        
        # Create a dictionary mapping for quick lookups
        authors_map = {a["id"]: a.get("display_name", "معلم مجهول") for a in authors_res.data}
        
        # 3. Format for frontend
        formatted = []
        for s in sugs.data:
            author_name = authors_map.get(s["author_id"], "معلم مجهول")
            formatted.append({
                "id": s["id"],
                "author": f"أ. {author_name}",
                "type": s["type"],
                "description": s["description"],
                "date": "مؤخراً", 
                "status": s["status"]
            })
        return {"suggestions": formatted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ==========================================
# AUDIO TRANSCRIPTION ENDPOINT
# ==========================================
@router.post("/transcribe-audio")
async def transcribe_audio(audio: UploadFile = File(...), user_id: str = Depends(verify_supabase_token)):
    require_gemini_client()
    try:
        # Read the raw audio bytes sent by the frontend
        audio_bytes = await audio.read()
        mime_type = audio.content_type or "audio/webm"
        
        # Tell Gemini exactly what to do with the audio
        prompt = "قم بتفريغ هذا المقطع الصوتي بدقة باللغة العربية. اكتب النص الذي تسمعه فقط دون أي إضافات."
        
        contents = [
            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
            types.Part.from_text(text=prompt)
        ]
        
        # Send to Gemini
        response = client.models.generate_content(
            model=CHAT_MODEL, 
            contents=contents
        )
        
        # Clean the response and send it back to the frontend
        transcription = clean_text((response.text or "").strip())
        
        return {"transcription": transcription}
    
    except Exception as e:
        print(f"Transcription Error: {e}")
        raise HTTPException(status_code=500, detail="فشل في معالجة أو تفريغ الصوت")