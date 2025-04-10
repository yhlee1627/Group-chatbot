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

# ── 환경 변수 로딩
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ── Socket.IO 구성
sio = AsyncServer(async_mode="asgi", cors_allowed_origins="*")
register_socket_events(sio)

# ── FastAPI 구성
fastapi_app = FastAPI()

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────── 로그인 라우터 ───────────
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

# ─────────── 데이터 조회 라우터 ───────────
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

# ─────────── 주제 + 방 생성 ───────────
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

# ─────────── GPT 평가 ───────────
@fastapi_app.post("/evaluate")
async def evaluate(request: Request):
    data = await request.json()
    room_id = data["room_id"]
    student_id = data["student_id"]

    msg_url = f"{SUPABASE_URL}/rest/v1/messages?room_id=eq.{room_id}&select=message,role,sender_id&order=timestamp.asc"
    msg_res = requests.get(msg_url, headers=HEADERS)
    messages = msg_res.json()
    student_msgs = [m for m in messages if m["role"] == "user" and m["sender_id"] == student_id]

    room_url = f"{SUPABASE_URL}/rest/v1/rooms?room_id=eq.{room_id}&select=topic_id"
    topic_id = requests.get(room_url, headers=HEADERS).json()[0]["topic_id"]

    topic_url = f"{SUPABASE_URL}/rest/v1/topics?topic_id=eq.{topic_id}&select=system_prompt,rubric_prompt"
    topic = requests.get(topic_url, headers=HEADERS).json()[0]

    prompt = f"""다음은 학생이 참여한 대화 내용입니다.

📋 평가 기준:
{topic['rubric_prompt']}

📩 학생 발언:
{chr(10).join([m['message'] for m in student_msgs])}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": topic['system_prompt']},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    result = response.choices[0].message.content.strip()
    return {"summary": result}

# ─────────── FastAPI + WebSocket 통합 ───────────
app = ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="ws/socket.io")