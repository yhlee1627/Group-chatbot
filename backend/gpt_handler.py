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
        chat_text = "\n".join([f"{m.get('name', m['sender_id'])}: {m['message']}" for m in recent_messages])
        system_prompt = await get_system_prompt(self.room_id)

        judgment_instruction = """
이 채팅방은 위와 같은 목적을 가진 공간입니다.

GPT는 교사의 보조교사로서, 다음 기준에 따라 개입 여부를 판단하세요:

- 특정 학생이 "모르겠어요", "하기 싫어요", "잘 모르겠네" 등 혼란, 부정, 거부 표현을 하면 그 학생에게 개입하세요.
- 대화가 끊기거나 소수만 말하고 있거나 주제에서 벗어난 경우 전체에게 개입하세요.
- 대화가 활발하게 잘 진행되고 있다면 개입하지 마세요. 대신 긍정적인 피드백을 주세요.

다음 중 하나의 JSON만 응답하세요:
{ "should_respond": false }
{ "should_respond": true, "target": "s02" }
{ "should_respond": true, "target": null }

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
            return json.loads(raw)
        except Exception as e:
            print("❌ 판단 오류:", e)
            return {"should_respond": False}

    async def generate_feedback(self, recent_messages, intervention_type, target=None):
        system_prompt = await get_system_prompt(self.room_id)

        if intervention_type == "positive":
            system_prompt += """
현재 학생들의 대화는 원활하게 잘 이어지고 있습니다.
학생들에게 긍정적인 피드백을 한 문장으로 전해주세요.
"""
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "학생들의 대화를 긍정적으로 평가해 주세요."}
            ]
            temperature = 0.5

        else:
            chat_text = "\n".join([f"{m.get('name', m['sender_id'])}: {m['message']}" for m in recent_messages])
            system_prompt += f"""
너는 {"특정 학생(" + target + ")" if target else "전체 학생"}에게 피드백을 주는 교사입니다.
학생의 상황에 맞게 따뜻하고 명확하게 도와주세요.
글은 50자를 넘지 않도록 명심하세요.
"""
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"최근 대화:\n{chat_text}"}
            ]
            temperature = 0.7

        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print("❌ 응답 생성 오류:", e)
            return "응답을 생성하는 데 실패했어요."

    async def process_auto_intervention(self, recent_messages, sid_to_user, sio):
        judgment = await self.should_respond(recent_messages)
        should_respond = judgment.get("should_respond", False)
        target = judgment.get("target") if should_respond else None

        intervention_type = "intervene" if should_respond else "positive"
        gpt_text = await self.generate_feedback(recent_messages, intervention_type, target)
        gpt_time = datetime.utcnow().isoformat()

        await save_message_to_db(self.room_id, "gpt", gpt_text, "assistant", gpt_time)

        if should_respond and target:
            for sid, uid in sid_to_user.items():
                if uid == target:
                    await sio.emit("receive_message", {
                        "sender_id": "gpt",
                        "message": gpt_text,
                        "role": "assistant",
                        "timestamp": gpt_time,
                        "target": target
                    }, to=sid)
                    return
        else:
            await sio.emit("receive_message", {
                "sender_id": "gpt",
                "message": gpt_text,
                "role": "assistant",
                "timestamp": gpt_time
            }, room=self.room_id)

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