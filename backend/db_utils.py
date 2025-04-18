import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경변수 로드
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Supabase 클라이언트 초기화
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def save_message_to_db(room_id, sender_id, message_content, role="user", timestamp=None, whisper_to=None, reasoning=""):
    """메시지를 데이터베이스에 저장"""
    if not timestamp:
        timestamp = datetime.datetime.utcnow().isoformat()
    
    try:
        result = supabase.table("messages").insert({
            "room_id": room_id,
            "sender_id": sender_id,
            "message": message_content,
            "role": role,
            "timestamp": timestamp,
            "whisper_to": whisper_to,
            "reasoning": reasoning
        }).execute()
        return result.data
    except Exception as e:
        print(f"메시지 저장 중 오류 발생: {e}")
        return None

async def save_gpt_intervention(room_id, message_id, intervention_type, target_student=None, reasoning=""):
    """GPT 자동 개입 로그를 저장하는 함수 (교사 대시보드용)"""
    try:
        print(f"저장 시도: room_id={room_id}, message_id={message_id}, type={intervention_type}, target={target_student}")
        
        # message_id 유효성 검사
        if message_id is None or message_id == 0:
            print(f"❌ 유효하지 않은 message_id: {message_id}")
            return None
        
        # 메시지 ID가 실제로 존재하는지 확인
        message_exists = supabase.table("messages").select("message_id").eq("message_id", message_id).execute()
        
        if not message_exists.data:
            print(f"❌ message_id={message_id}가 messages 테이블에 존재하지 않습니다.")
            # 가장 최근 메시지 ID 사용
            recent_message = supabase.table("messages").select("message_id").order("timestamp", desc=True).limit(1).execute()
            if recent_message.data:
                message_id = recent_message.data[0]["message_id"]
                print(f"✅ 최근 메시지 ID로 대체: {message_id}")
            else:
                print("❌ 메시지 테이블에 데이터가 없습니다.")
                return None
        
        # 타입 변환 시도
        if not isinstance(message_id, (int, float)):
            try:
                message_id = int(message_id)
            except (ValueError, TypeError):
                print(f"❌ message_id 변환 실패: {message_id}를 정수로 변환할 수 없음")
                return None
        
        data = {
            "room_id": room_id,
            "message_id": message_id,
            "intervention_type": intervention_type,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        if target_student:
            data["target_student"] = target_student
            
        if reasoning:
            data["reasoning"] = reasoning
            
        result = supabase.table("gpt_interventions").insert(data).execute()
        print("✅ GPT 개입 로그 저장 성공")
        return result.data
    except Exception as e:
        print(f"GPT 개입 로그 저장 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None 