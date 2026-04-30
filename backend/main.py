# /Users/aimanabed/Desktop/Halman/HalmanApp/backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router

app = FastAPI(title="HalmanApp API", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"status": "HalmanApp API is online and healthy."}

# Include all modularized routes
app.include_router(router)