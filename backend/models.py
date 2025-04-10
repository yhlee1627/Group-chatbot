from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ✅ 클라이언트로부터 받는 메시지 구조
class MessageIn(BaseModel):
    room_id: str
    sender_id: str
    message: str

# ✅ 클라이언트에게 보내는 메시지 구조
class MessageOut(BaseModel):
    sender: str
    message: str
    role: str
    timestamp: datetime

# ✅ GPT 응답을 만들기 위한 메시지 구조
class GPTMessage(BaseModel):
    role: str  # "user" or "assistant"
    message: str

# ✅ 채팅방 정보
class Room(BaseModel):
    room_id: str
    title: str
    topic_id: Optional[str]
    class_id: Optional[str]
    created_at: Optional[datetime]

# ✅ 주제 정보
class Topic(BaseModel):
    topic_id: str
    title: str
    system_prompt: str
    rubric_prompt: str
    class_id: Optional[str]
    created_at: Optional[datetime]

# ✅ 사용자 정보 (옵션)
class User(BaseModel):
    student_id: str
    name: str
    class_id: str