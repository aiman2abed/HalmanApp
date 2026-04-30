from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional

class RiasecScores(BaseModel):
    Realistic: int
    Investigative: int
    Artistic: int
    Social: int
    Enterprising: int
    Conventional: int

class AssessmentCardResponse(BaseModel):
    id: int
    prompt_text: str
    primary_trait: str
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class AdaptiveRequest(BaseModel):
    current_scores: Dict[str, int]

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

class RoleAssignmentRequest(BaseModel):
    target_user_id: str
    role: str
    scope_type: str
    scope_id: Optional[str] = None

class CMSVideoCreate(BaseModel):
    title: str
    description: str
    hashtag: str
    video_url: str

class VideoActionRequest(BaseModel):
    video_id: str

class SuggestionCreate(BaseModel):
    student_id: str
    type: str
    description: str

class SuggestionUpdate(BaseModel):
    status: str