import os
import requests
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ✅ 메시지 저장
async def save_message_to_db(room_id, sender_id, content, role, timestamp):
    data = {
        "room_id": room_id,
        "sender_id": sender_id,
        "message": content,
        "role": role,
        "timestamp": timestamp
    }
    try:
        res = requests.post(f"{SUPABASE_URL}/rest/v1/messages", json=data, headers=HEADERS)
        if res.status_code != 201:
            print("❌ 메시지 저장 실패:", res.status_code, res.text)
    except Exception as e:
        print("❌ 저장 중 예외:", str(e))

# ✅ 대화 기록 불러오기 (화자 포함)
async def get_room_history(room_id):
    url = (
        f"{SUPABASE_URL}/rest/v1/messages"
        f"?room_id=eq.{room_id}"
        f"&select=sender_id,message,role,timestamp"
        f"&order=timestamp.asc"
    )
    res = requests.get(url, headers=HEADERS)
    return res.json() if res.status_code == 200 else []

# ✅ system_prompt 가져오기
async def get_system_prompt(room_id):
    # rooms 테이블에서 topic_id 조회
    room_url = f"{SUPABASE_URL}/rest/v1/rooms?room_id=eq.{room_id}&select=topic_id"
    room_res = requests.get(room_url, headers=HEADERS)
    topic_id = room_res.json()[0].get("topic_id") if room_res.status_code == 200 else None

    if not topic_id:
        return None

    # topics 테이블에서 system_prompt 조회
    topic_url = f"{SUPABASE_URL}/rest/v1/topics?topic_id=eq.{topic_id}&select=system_prompt"
    topic_res = requests.get(topic_url, headers=HEADERS)
    return topic_res.json()[0].get("system_prompt") if topic_res.status_code == 200 else None