import os
import requests
import aiohttp
import json
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

# ✅ 비동기 Supabase 요청 헬퍼 함수
async def make_supabase_request(method, url, data=None):
    """
    비동기적으로 Supabase API 요청을 수행하는 함수
    - method: HTTP 메서드 (GET, POST, PUT, DELETE 등)
    - url: 요청 URL
    - data: 요청 데이터 (있는 경우)
    """
    try:
        async with aiohttp.ClientSession() as session:
            if method == "GET":
                async with session.get(url, headers=HEADERS) as response:
                    if response.status in (200, 201, 204):
                        return await response.json()
                    else:
                        error_text = await response.text()
                        print(f"❌ Supabase API 오류 ({method} {url}): {error_text}")
                        return None
            elif method == "POST":
                async with session.post(url, headers=HEADERS, json=data) as response:
                    if response.status in (200, 201, 204):
                        # 응답에 따라 JSON 또는 ID 값 반환
                        try:
                            return await response.json()
                        except:
                            return {"id": response.headers.get("Location", "").split("/")[-1]}
                    else:
                        error_text = await response.text()
                        print(f"❌ Supabase API 오류 ({method} {url}): {error_text}")
                        return None
            elif method == "PUT":
                async with session.put(url, headers=HEADERS, json=data) as response:
                    if response.status in (200, 201, 204):
                        return await response.json()
                    else:
                        error_text = await response.text()
                        print(f"❌ Supabase API 오류 ({method} {url}): {error_text}")
                        return None
            elif method == "DELETE":
                async with session.delete(url, headers=HEADERS) as response:
                    if response.status in (200, 201, 204):
                        return await response.json()
                    else:
                        error_text = await response.text()
                        print(f"❌ Supabase API 오류 ({method} {url}): {error_text}")
                        return None
    except Exception as e:
        print(f"❌ Supabase 요청 오류: {e}")
        return None

# ✅ 메시지 저장
async def save_message_to_db(room_id, sender_id, message, role="user", timestamp=None, whisper_to=None, reasoning=None):
    """
    ✅ 메시지를 Supabase의 messages 테이블에 저장하는 함수
    - room_id: 방 ID (필수)
    - sender_id: 발신자 ID (필수)
    - message: 메시지 내용 (필수)
    - role: 역할 (user/assistant)
    - timestamp: 메시지 시간 (없으면 현재 시간)
    - whisper_to: 귓속말 대상 (특정 학생에게만 보이는 메시지)
    - reasoning: GPT의 판단 이유 (assistant 역할일 때만 사용)
    """
    try:
        # 메시지 데이터 구성
        data = {
            "room_id": room_id,
            "sender_id": sender_id,
            "message": message,
            "role": role
        }

        # timestamp 파라미터가 있으면 사용, 없으면 현재 시간
        if timestamp:
            data["timestamp"] = timestamp
            
        # whisper_to 값이 있는 경우 추가
        if whisper_to:
            data["whisper_to"] = whisper_to
            
        # reasoning 값이 있는 경우 추가
        if reasoning:
            data["reasoning"] = reasoning

        url = f"{SUPABASE_URL}/rest/v1/messages"
        
        # Prefer 헤더를 수정하여 삽입된 레코드를 반환하도록 함
        local_headers = HEADERS.copy()
        local_headers["Prefer"] = "return=representation"
        
        # 직접 aiohttp로 요청 처리
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=local_headers, json=data) as response:
                if response.status in (200, 201, 204):
                    response_data = await response.json()
                    print(f"✅ 메시지 저장 성공: {response_data}")
                    return response_data[0] if isinstance(response_data, list) else response_data
                else:
                    error_text = await response.text()
                    print(f"❌ Supabase API 오류 (POST {url}): {error_text}")
                    return None
    except Exception as e:
        print(f"❌ 메시지 저장 오류: {e}")
        return None

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

async def save_gpt_intervention(room_id, message_id, intervention_type, target_student=None, reasoning=None):
    """
    ✅ GPT 개입 로그를 gpt_interventions 테이블에 저장하는 함수
    - room_id: 방 ID (필수)
    - message_id: 메시지 ID (필수)
    - intervention_type: 개입 유형 (필수)
    - target_student: 타겟 학생 ID
    - reasoning: GPT의 판단 이유
    """
    try:
        data = {
            "room_id": room_id,
            "message_id": message_id,
            "intervention_type": intervention_type,
        }
        
        if target_student:
            data["target_student"] = target_student
            
        if reasoning:
            data["reasoning"] = reasoning
            
        url = f"{SUPABASE_URL}/rest/v1/gpt_interventions"
        response = await make_supabase_request("POST", url, data)
        
        return response
    except Exception as e:
        print(f"❌ GPT 개입 로그 저장 오류: {e}")
        return None