import os
import uuid
import requests
import openai
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from socketio import AsyncServer, ASGIApp
from socket_events import register_socket_events
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client
import traceback
from gpt_handler import evaluate_conversation

# ─────────── 환경 변수 로딩
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")

client = AsyncOpenAI(api_key=openai.api_key)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ─────────── Socket.IO 구성
sio = AsyncServer(async_mode="asgi", cors_allowed_origins="*")
register_socket_events(sio)

# ─────────── FastAPI 앱 구성
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#test
# ─────────── 로그인 라우터
@fastapi_app.get("/students/{student_id}")
async def get_student(student_id: str):
    url = f"{SUPABASE_URL}/rest/v1/students?student_id=eq.{student_id}&select=student_id,password,class_id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return JSONResponse(content=res.json()[0], status_code=200)
    return JSONResponse(content={"error": "존재하지 않는 학생 ID"}, status_code=404)

@fastapi_app.get("/teachers/{teacher_id}")
async def get_teacher(teacher_id: str):
    url = f"{SUPABASE_URL}/rest/v1/teachers?teacher_id=eq.{teacher_id}&select=teacher_id,password,class_id,name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return JSONResponse(content=res.json()[0], status_code=200)
    return JSONResponse(content={"error": "존재하지 않는 교사 ID"}, status_code=404)

@fastapi_app.get("/admins/{admin_id}")
async def get_admin(admin_id: str):
    url = f"{SUPABASE_URL}/rest/v1/admins?admin_id=eq.{admin_id}&select=admin_id,password"
    res = requests.get(url, headers=HEADERS)
    if res.status_code == 200 and res.json():
        return JSONResponse(content=res.json()[0], status_code=200)
    return JSONResponse(content={"error": "존재하지 않는 관리자 ID"}, status_code=404)

# ─────────── 데이터 조회 라우터
@fastapi_app.get("/classes")
async def get_classes():
    url = f"{SUPABASE_URL}/rest/v1/classes?select=class_id,name"
    res = requests.get(url, headers=HEADERS)
    return res.json()

@fastapi_app.get("/topics")
async def get_topics():
    url = f"{SUPABASE_URL}/rest/v1/topics?select=topic_id,title,system_prompt,rubric_prompt,class_id,created_at"
    res = requests.get(url, headers=HEADERS)
    return res.json()

@fastapi_app.get("/rooms")
async def get_rooms():
    url = f"{SUPABASE_URL}/rest/v1/rooms?select=room_id,title,topic_id,created_at"
    res = requests.get(url, headers=HEADERS)
    return res.json()

@fastapi_app.get("/messages")
async def get_messages(room_id: str):
    url = f"{SUPABASE_URL}/rest/v1/messages?room_id=eq.{room_id}&select=message,role,sender_id,timestamp&order=timestamp.asc"
    res = requests.get(url, headers=HEADERS)
    return res.json()

# ─────────── 주제 + 방 생성 라우터
@fastapi_app.post("/topics")
async def create_topic_with_rooms(request: Request):
    body = await request.json()
    try:
        topic_id = str(uuid.uuid4())
        topic_data = {
            "topic_id": topic_id,
            "title": body["title"],
            "system_prompt": body["system_prompt"],
            "rubric_prompt": body["rubric_prompt"],
            "class_id": body["class_id"],
            "created_at": datetime.utcnow().isoformat(),
        }

        topic_url = f"{SUPABASE_URL}/rest/v1/topics"
        topic_res = requests.post(topic_url, json=topic_data, headers=HEADERS)
        if topic_res.status_code != 201:
            return {"error": "주제 생성 실패", "detail": topic_res.text}

        room_count = int(body.get("room_count", 1))
        rooms = [
            {
                "room_id": str(uuid.uuid4()),
                "title": f"{body['title']} - 조 {i+1}",
                "topic_id": topic_id,
                "created_at": datetime.utcnow().isoformat()
            }
            for i in range(room_count)
        ]

        room_url = f"{SUPABASE_URL}/rest/v1/rooms"
        room_res = requests.post(room_url, json=rooms, headers=HEADERS)

        if room_res.status_code != 201:
            return {"error": "방 생성 실패", "detail": room_res.text}

        return {"message": "✅ 주제 및 방 생성 완료", "topic_id": topic_id}
    except Exception as e:
        return {"error": "서버 내부 오류", "detail": str(e)}

# ─────────── GPT 평가 라우터
class ChatMessage(BaseModel):
    sender_id: str
    message: str

class EvaluationRequest(BaseModel):
    topic_id: str
    rubric_prompt: str
    target_student: Optional[str] = None
    room_id: Optional[str] = None
    class_id: Optional[str] = None
    conversation_id: Optional[str] = None
    messages: List[ChatMessage]

@fastapi_app.post("/evaluate-chat")
async def evaluate_chat(request: Request):
    try:
        body = await request.json()
        data = EvaluationRequest(**body)

        print("📩 GPT 평가 요청:", data.topic_id, "/", data.target_student or "전체")

        # ✅ GPT 평가 핸들러 호출
        feedback = await evaluate_conversation(
            rubric_prompt=data.rubric_prompt,
            messages=[m.dict() for m in data.messages]
        )

        print("✅ GPT 평가 결과 생성 완료")
        print("📄 평가 요약:\n", feedback[:200], "...")

        # ✅ 평가 결과 Supabase 저장
        supabase = create_client(SUPABASE_URL, SERVICE_KEY)
        insert_data = {
            "topic_id": data.topic_id,
            "room_id": data.room_id,
            "class_id": data.class_id,
            "student_id": data.target_student,
            "conversation_id": data.conversation_id,
            "summary": feedback,
            "evaluation_type": "individual" if data.target_student else "group"
        }
        supabase.table("gpt_chat_evaluations").insert(insert_data).execute()

        return {"feedback": feedback}
    except Exception as e:
        print("❌ GPT 평가 오류:", e)
        traceback.print_exc()
        return {"feedback": "GPT 평가 생성 중 오류가 발생했습니다."}
    
app = ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="ws/socket.io")