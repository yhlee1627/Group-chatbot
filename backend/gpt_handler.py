import os
import json
from openai import AsyncOpenAI
from supabase_client import get_room_history, get_system_prompt

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# STEP 1: 개입 필요 여부 판단
async def gpt_should_respond(messages, room_id):
    chat_text = "\n".join([f"{m['sender_id']}: {m['message']}" for m in messages])
    system_prompt = await get_system_prompt(room_id)

    # 프롬프트는 교사가 입력한 system_prompt + 판단 지침 추가
    system_prompt += """

학생들의 대화를 보고, 개입이 필요한지 판단하세요.

- 개입이 필요 없으면:
{ "should_respond": false }

- 개입이 필요하면:
{ "should_respond": true, "target": "s02" } (target은 특정 학생 ID 또는 null)

반드시 위 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
"""

    messages_for_gpt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"최근 대화:\n{chat_text}"}
    ]

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_gpt,
            temperature=0
        )
        raw = response.choices[0].message.content.strip()
        print("🧠 GPT 판단 응답:", raw)
        return json.loads(raw)
    except Exception as e:
        print("❌ 판단 오류:", e)
        return {"should_respond": False}

# STEP 2: 실제 응답 생성
async def gpt_generate_response(messages, target, room_id):
    chat_text = "\n".join([f"{m['sender_id']}: {m['message']}" for m in messages])
    system_prompt = await get_system_prompt(room_id)

    system_prompt += f"""

너는 {"특정 학생(" + target + ")" if target else "전체 학생"}에게 피드백을 주는 교사입니다.
"""

    messages_for_gpt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"최근 대화:\n{chat_text}"}
    ]

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_gpt,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("❌ 응답 생성 오류:", e)
        return "응답을 생성하는 데 실패했어요."