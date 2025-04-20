import os
import json
from datetime import datetime
from openai import AsyncOpenAI
from supabase_client import (
    get_room_history,
    get_system_prompt,
    get_student_name,
    save_message_to_db
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class GPTInterventionService:
    """
    GPT 개입 서비스 클래스
    - 1단계: 개입 여부 판단
    - 2단계: 응답 생성 및 전송
    """

    def __init__(self, room_id):
        self.room_id = room_id

    async def should_respond(self, recent_messages):
        # 참여한 학생 ID 목록 생성
        participant_ids = set()
        for msg in recent_messages:
            if msg.get('sender_id') and msg['sender_id'].startswith('2s'):
                participant_ids.add(msg['sender_id'])
        
        participant_list = ", ".join(participant_ids)
        
        chat_text = "\n".join([f"{m.get('name', m['sender_id'])}: {m['message']}" for m in recent_messages])
        system_prompt = await get_system_prompt(self.room_id)

        judgment_instruction = f"""
이 채팅방은 위와 같은 목적을 가진 공간입니다.

GPT는 교사의 보조교사로서, 다음 기준에 따라 개입 상황을 판단하세요:

상황 1: 학생들이 주어진 주제에 맞게 잘 토론하고 있다면 → 긍정적인 피드백 (응답 유형: "positive")
상황 2: 학생들이 주어진 주제와 맞지 않게 대화하거나 방향성이 필요한 경우 → 방향 제시 피드백 (응답 유형: "guidance")
상황 3: 특정 학생이 잘 참여하지 못하거나 방향이 다른 말을 하는 경우 → 개인 피드백 (응답 유형: "individual")
상황 4: 개입이 불필요한 경우 → 개입하지 않음 (응답 유형: "none")

현재 채팅에 참여 중인 학생 ID 목록: {participant_list}

다음 형식의 JSON으로 응답하세요:
{{
  "intervention_type": "positive" 또는 "guidance" 또는 "individual" 또는 "none",
  "target_student": null 또는 실제 학생 ID (예: "2s01", "2s02" 등, 개인 피드백인 경우만 학생 ID 지정),
  "reasoning": "판단 이유를 간략히 설명"
}}

⚠️ 매우 중요: "target_student"는 반드시 위 참여자 목록에 있는 학생 ID만 지정해야 합니다.
⚠️ 학생 이름이나 번호가 아닌 정확한 ID를 사용해야 합니다.
⚠️ 잘못된 ID를 지정하면 메시지가 엉뚱한 학생에게 전송될 수 있습니다.
⚠️ JSON 외의 설명은 절대 포함하지 마세요.
"""

        full_prompt = f"{system_prompt.strip()}\n\n{judgment_instruction.strip()}"

        messages = [
            {"role": "system", "content": full_prompt},
            {"role": "user", "content": f"최근 대화:\n{chat_text}"}
        ]

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0
            )
            raw = response.choices[0].message.content.strip()
            print("🧠 GPT 판단 응답:", raw)
            result = json.loads(raw)
            
            # 이전 형식과의 호환성 유지
            should_respond = result["intervention_type"] != "none"
            target = result.get("target_student") if result["intervention_type"] == "individual" else None
            
            # ⚠️ 안전성 검증: target이 참여자 목록에 있는지 확인
            if target and target not in participant_ids:
                print(f"⚠️ GPT가 잘못된 학생 ID({target})를 지정했습니다. 참여자 목록: {participant_list}")
                # 개인 피드백을 전체 피드백으로 변경
                result["intervention_type"] = "guidance"
                result["target_student"] = None
                result["reasoning"] += " (경고: 대상 학생 ID가 참여자 목록에 없어 전체 피드백으로 변경됨)"
                target = None
                print("⚠️ 개인 피드백이 전체 피드백으로 변경되었습니다.")
            
            return {
                "should_respond": should_respond,
                "target": target,
                "target_student": target,
                "intervention_type": result["intervention_type"],
                "reasoning": result.get("reasoning", "")
            }
        except Exception as e:
            print("❌ 판단 오류:", e)
            return {"should_respond": False, "intervention_type": "none", "target": None}

    async def generate_feedback(self, recent_messages, intervention_type, target=None):
        system_prompt = await get_system_prompt(self.room_id)
        chat_text = "\n".join([f"{m.get('name', m['sender_id'])}: {m['message']}" for m in recent_messages])
        
        # 참여자 목록 생성 (유효한 타겟 확인용)
        participant_ids = set()
        for msg in recent_messages:
            if msg.get('sender_id') and msg['sender_id'].startswith('2s'):
                participant_ids.add(msg['sender_id'])
        
        feedback_instruction = ""
        
        if intervention_type == "positive":
            feedback_instruction = """
학생들이 주어진 주제에 맞게 잘 토론하고 있습니다.
긍정적인 피드백을 통해 학생들의 대화를 장려해주세요.
명확한 문장으로 학생들의 좋은 점을 칭찬하고 계속 대화를 이어가도록 동기부여 해주세요.
"""
            temperature = 0.5
            
        elif intervention_type == "guidance":
            feedback_instruction = """
학생들이 주어진 주제에서 벗어나고 있거나 방향성이 필요합니다.
주제로 다시 집중할 수 있도록 안내해주세요.
친절하고 명확한 방향 제시와 함께 구체적인 질문이나 활동을 제안해주세요.
500자 내외로 효과적인 피드백을 작성하세요.
"""
            temperature = 0.7
            
        elif intervention_type == "individual":
            # 타겟 학생이 유효한지 재확인
            if not target or target not in participant_ids:
                print(f"⚠️ 유효하지 않은 학생 ID로 개인 피드백 생성 시도: {target}")
                # 대안으로 일반 안내 피드백 제공
                return "현재 대화에 도움이 필요해 보입니다. 주제에 맞게 집중해서 대화를 이어가면 좋겠습니다."
                
            try:
                student_name = get_student_name(target)
                if not student_name or student_name == target:
                    # 이름을 가져오지 못한 경우 ID로 대체
                    student_name = f"학생({target})"
            except Exception as e:
                print(f"❌ 학생 이름 조회 오류: {e}")
                student_name = f"학생({target})"
                
            feedback_instruction = f"""
특정 학생({student_name}, ID: {target})에게 개인적인 피드백이 필요합니다.
이 학생은 참여가 부족하거나 토론 방향과 다른 대화를 하고 있습니다.
학생을 존중하면서도 명확하게 도움을 주는 개인 피드백을 작성하세요.
이 메시지는 해당 학생에게만 보이는 귓속말로 전달됩니다.
500자 내외로 효과적으로 작성하세요.
"""
            temperature = 0.7
        
        else:
            # 개입이 없는 경우 (이 코드는 실행되지 않아야 함)
            return "피드백이 필요하지 않습니다."

        prompt_messages = [
            {"role": "system", "content": f"{system_prompt}\n\n{feedback_instruction}"},
            {"role": "user", "content": f"최근 대화:\n{chat_text}"}
        ]

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=prompt_messages,
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print("❌ 응답 생성 오류:", e)
            return "응답을 생성하는 데 실패했어요."

    async def process_auto_intervention(self, recent_messages, sid_to_user, sio):
        judgment = await self.should_respond(recent_messages)
        should_respond = judgment.get("should_respond", False)
        intervention_type = judgment.get("intervention_type", "none")
        target = judgment.get("target")
        reasoning = judgment.get("reasoning", "")
        
        if not should_respond:
            print("🤖 GPT 판단: 개입 불필요")
            return
        
        # 안전성 검증: 타겟 학생이 지정되었는데 실제 참여자 목록에 없는 경우 처리
        if intervention_type == "individual" and target:
            # 실제 채팅방 참여자 ID 목록
            participant_ids = list(sid_to_user.values())
            
            if target not in participant_ids:
                print(f"⚠️ 경고: 타겟 학생 ID({target})가 참여자 목록에 없습니다!")
                print(f"💡 참여자 목록: {participant_ids}")
                
                # 에러 로깅 후 개인 피드백을 전체 피드백으로 변경
                intervention_type = "guidance"
                target = None
                reasoning += " (주의: 개인 피드백이 전체 피드백으로 변경됨 - 대상 학생을 찾을 수 없음)"
        
        print(f"🤖 GPT 판단: {intervention_type} 유형 피드백 제공" + (f" ({target}에게)" if target else ""))
        
        gpt_text = await self.generate_feedback(recent_messages, intervention_type, target)
        gpt_time = datetime.utcnow().isoformat()

        # 메시지 DB 저장
        saved_message = await save_message_to_db(
            self.room_id, 
            "gpt", 
            gpt_text, 
            "assistant", 
            gpt_time, 
            whisper_to=target if intervention_type == "individual" else None,
            reasoning=reasoning
        )
        
        print(f"✅ 메시지 응답: {saved_message}")

        if intervention_type == "individual" and target:
            # 개인 피드백 (귓속말)
            message_sent = False
            for sid, uid in sid_to_user.items():
                if uid == target:
                    await sio.emit("receive_message", {
                        "sender_id": "gpt",
                        "message": gpt_text,
                        "role": "assistant",
                        "timestamp": gpt_time,
                        "target": target,
                        "whisper": True,
                        "whisper_to": target,  # 일관성을 위해 두 필드 모두 설정
                        "reasoning": reasoning
                    }, to=sid)
                    print(f"✉️ 귓속말 전송: {target}에게")
                    message_sent = True
                    break
            
            # 메시지를 보내지 못했다면 로그에 기록
            if not message_sent:
                print(f"⚠️ 경고: {target}에게 귓속말을 보내지 못했습니다. 클라이언트가 연결되어 있지 않을 수 있습니다.")
        else:
            # 전체 피드백
            await sio.emit("receive_message", {
                "sender_id": "gpt",
                "message": gpt_text,
                "role": "assistant",
                "timestamp": gpt_time,
                "feedback_type": intervention_type,
                "reasoning": reasoning
            }, room=self.room_id)
            print(f"📢 전체 메시지 전송: {intervention_type} 유형")

    async def generate_direct_response(self, recent_messages, student_question, student_id):
        """
        학생이 GPT에게 직접 질문한 경우 응답을 생성하는 함수
        - recent_messages: 최근 대화 기록
        - student_question: 학생의 질문
        - student_id: 질문한 학생의 ID
        """
        system_prompt = await get_system_prompt(self.room_id)
        chat_text = "\n".join([f"{m.get('name', m['sender_id'])}: {m['message']}" for m in recent_messages])
        student_name = get_student_name(student_id) if student_id else "학생"
        
        direct_question_instruction = f"""
{student_name}(ID: {student_id})가 당신에게 직접 질문했습니다.
이 채팅방은 '{system_prompt}'라는 주제/목적을 가진 공간입니다.

응답 가이드라인:
1. 명확하게 답변하세요.
2. 중요한 정보는 한 문단에 하나씩 제시하세요.
3. 내용이 많다면 2-3개의 핵심 카테고리로 나누어 제시하세요.
4. 학생 수준에 맞는 언어로 설명하되, 전문 용어가 필요할 때는 간단한 설명을 덧붙이세요.
5. 첫 문장에서 질문의 핵심에 직접 답하고, 그 다음에 추가 정보를 제공하세요.
6. 문장은 짧고 명확하게 작성하세요. 한 문장에 2개 이상의 정보는 담지 마세요.

응답 형식:
- 총 길이: 500자 내외로 제한하세요.
- ** 기호를 사용하지 마세요.
"""

        prompt_messages = [
            {"role": "system", "content": direct_question_instruction},
            {"role": "user", "content": f"최근 대화:\n{chat_text}\n\n{student_name}의 질문: {student_question}"}
        ]

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=prompt_messages,
                temperature=0.5,  # 더 일관된 응답을 위해 온도 낮춤
                max_tokens=600   # 응답 길이 제한
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print("❌ 직접 질문 응답 생성 오류:", e)
            return "죄송합니다, 질문에 대한 답변을 생성하는 데 문제가 발생했습니다. 다시 질문해 주세요."

# ─────────── 평가 전용 함수 (GPT 평가 생성) ───────────
async def evaluate_conversation(rubric_prompt: str, messages: list[dict]) -> str:
    """
    ✅ GPT에게 루브릭과 채팅 대화를 전달하여 평가 결과를 생성하는 함수
    - rubric_prompt: 교사가 작성한 평가 기준
    - messages: [{sender_id, message}, ...]
    - return: 평가 요약 텍스트
    """
    try:
        system_prompt = f"""
당신은 교사가 작성한 루브릭을 기반으로 학생들의 대화를 평가하는 AI 평가 보조자입니다.

📋 루브릭:
{rubric_prompt}

아래 대화를 분석해 교사에게 제공할 평가 피드백을 작성하세요.
"""
        chat_log = "\n".join([f"{m['sender_id']}: {m['message']}" for m in messages])

        prompt_messages = [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": f"대화:\n{chat_log}"}
        ]

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=prompt_messages,
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("❌ GPT 평가 생성 오류:", e)
        return "GPT 평가 생성 중 오류가 발생했습니다."