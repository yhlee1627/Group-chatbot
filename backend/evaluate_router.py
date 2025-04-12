from fastapi import APIRouter
from pydantic import BaseModel
from openai import AsyncOpenAI
from typing import List, Optional
from dotenv import load_dotenv
import os
import traceback

load_dotenv()

router = APIRouter()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 💬 메시지 모델
class ChatMessage(BaseModel):
    sender_id: str
    message: str

# 📤 평가 요청 모델
class EvaluationRequest(BaseModel):
    topic_id: str
    rubric_prompt: str
    target_student: Optional[str] = None
    room_id: Optional[str] = None
    class_id: Optional[str] = None
    conversation_id: Optional[str] = None
    messages: List[ChatMessage]

# 📥 평가 응답 모델
class EvaluationResponse(BaseModel):
    feedback: str

# 🗃 Supabase 저장 함수
def save_evaluation_result(summary, topic_id, room_id, student_id=None,
                           class_id=None, conversation_id=None):
    from supabase import create_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)

    data = {
        "summary": summary,
        "topic_id": topic_id,
        "room_id": room_id,
        "student_id": student_id,
        "class_id": class_id,
        "conversation_id": conversation_id,
        "evaluation_type": "individual" if student_id else "group",
    }

    print("📥 저장할 평가 결과:", data)

    try:
        res = supabase.table("gpt_chat_evaluations").insert(data).execute()
        print("✅ 평가 결과 저장 완료:", res)
    except Exception as e:
        print("❌ 평가 결과 저장 실패:", e)
        traceback.print_exc()

# 🎯 GPT 평가 API 라우터
@router.post("/evaluate-chat", response_model=EvaluationResponse)
async def evaluate_chat(data: EvaluationRequest):
    print("📩 평가 요청 도착:", data.topic_id)
    print("👤 평가 대상:", data.target_student or "전체")

    # 1. system_prompt 구성
    system_prompt = f"""
당신은 교사가 작성한 루브릭을 기반으로 학생 대화를 평가하는 AI 평가 보조자입니다.

📋 루브릭:
{data.rubric_prompt}

아래의 대화를 분석하여 교사에게 제공할 평가 피드백을 작성해주세요.
"""

    # 2. 대화 로그 구성
    chat_log = "\n".join([f"{m.sender_id}: {m.message}" for m in data.messages])

    messages = [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user", "content": f"대화:\n{chat_log}"}
    ]

    try:
        # 3. GPT 응답 생성
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
        )
        feedback = response.choices[0].message.content.strip()
        print("📤 GPT 평가 결과 생성 완료")
        print("📄 평가 요약:\n", feedback[:200], "...")

        # 4. 평가 결과 저장
        save_evaluation_result(
            summary=feedback,
            topic_id=data.topic_id,
            room_id=data.room_id,
            student_id=data.target_student,
            class_id=data.class_id,
            conversation_id=data.conversation_id
        )

        return EvaluationResponse(feedback=feedback)

    except Exception as e:
        print("❌ GPT 평가 오류:", e)
        traceback.print_exc()
        return EvaluationResponse(feedback="GPT 평가 생성 중 오류가 발생했습니다.")