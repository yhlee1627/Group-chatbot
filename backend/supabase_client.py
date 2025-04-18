import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# 환경변수 로드
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# ✅ 메시지 저장
async def save_message_to_db(room_id, sender_id, message, role="user", timestamp=None, whisper_to=None, reasoning=None):
    """
    메시지를 Supabase DB에 저장합니다.
    - room_id: 채팅방 ID
    - sender_id: 보낸 사람 ID (예: "s01", "gpt")
    - message: 메시지 내용
    - role: 역할 ("user", "assistant", "system")
    - timestamp: 타임스탬프 (없으면 현재 시간)
    - whisper_to: 귓속말 대상 (특정 학생에게만 보이는 메시지)
    - reasoning: GPT의 판단 이유 (assistant 역할일 때만 사용)
    """
    if not timestamp:
        timestamp = datetime.utcnow().isoformat()

    data = {
        "room_id": room_id,
        "sender_id": sender_id,
        "message": message,
        "role": role,
        "timestamp": timestamp
    }
    
    # 귓속말 대상이 있는 경우
    if whisper_to:
        data["whisper_to"] = whisper_to
        
    # reasoning 값이 있는 경우 추가
    if reasoning:
        data["reasoning"] = reasoning

    url = f"{SUPABASE_URL}/rest/v1/messages"
    res = requests.post(url, json=data, headers=HEADERS)
    if res.status_code != 201:
        print(f"❌ 메시지 저장 실패: {res.text}")
        return False
    return True

# ✅ 대화 기록 불러오기 (화자 포함)
async def get_room_history(room_id):
    """
    특정 채팅방의 메시지 기록을 가져옵니다. 
    시간순으로 정렬되어 반환됩니다.
    """
    url = f"{SUPABASE_URL}/rest/v1/messages?room_id=eq.{room_id}&select=message,role,sender_id,timestamp,whisper_to,reasoning&order=timestamp.asc"
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200:
        print(f"❌ 채팅 기록 조회 실패: {res.text}")
        return []
    return res.json()

# ✅ system_prompt 가져오기
async def get_system_prompt(room_id):
    """
    채팅방에 연결된 시스템 프롬프트를 가져옵니다.
    """
    url = f"{SUPABASE_URL}/rest/v1/rooms?room_id=eq.{room_id}&select=topic_id"
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200 or not res.json():
        print(f"❌ 채팅방 정보 조회 실패: {res.text}")
        return "이 채팅방에는 특별한 목적이 없습니다. 일반적인 대화를 이어가세요."

    topic_id = res.json()[0]["topic_id"]
    url = f"{SUPABASE_URL}/rest/v1/topics?topic_id=eq.{topic_id}&select=system_prompt"
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200 or not res.json():
        print(f"❌ 토픽 정보 조회 실패: {res.text}")
        return "이 채팅방에는 특별한 목적이 없습니다. 일반적인 대화를 이어가세요."

    return res.json()[0]["system_prompt"]


def get_student_name(student_id):
    """
    학생 ID에 해당하는 이름을 가져옵니다.
    """
    if not student_id or student_id == "gpt":
        return None

    url = f"{SUPABASE_URL}/rest/v1/students?student_id=eq.{student_id}&select=name"
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200 or not res.json():
        print(f"❌ 학생 정보 조회 실패: {res.text}")
        return student_id

    name = res.json()[0]["name"]
    return name if name else student_id

def save_evaluation_result(topic_id, target_student, feedback):
    from supabase import create_client
    import os

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)

    data = {
        "topic_id": topic_id,
        "target_student": target_student,
        "feedback": feedback,
    }

    try:
        res = supabase.table("evaluations").insert(data).execute()
        print("✅ 평가 결과 저장 완료")
    except Exception as e:
        print("❌ 평가 결과 저장 실패:", e)