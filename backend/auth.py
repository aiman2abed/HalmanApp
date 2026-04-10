import jwt
from fastapi import HTTPException, Header, Depends
from database import get_db

def verify_supabase_token(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        if not user_id: 
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def verify_app_developer(user_id: str):
    db = get_db()
    res = db.table("user_role_assignments").select("*").eq("user_id", user_id).eq("role", "app_developer").execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=403, detail="Forbidden")