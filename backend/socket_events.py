import datetime
from supabase_client import (
    save_message_to_db,
    get_room_history,
    get_student_name
)
from gpt_handler import GPTInterventionService

sid_to_user = {}
sid_to_room = {}
recent_messages = {}  # room_id → [messages]
MESSAGE_LIMIT = 6  # 최근 메시지 기준 (확대 가능)

def build_participants(sid_to_user, sid_to_room, current_room):
    return [
        {
            "student_id": uid,
            "name": get_student_name(uid)
        }
        for k, uid in sid_to_user.items()
        if sid_to_room.get(k) == current_room
    ]

def register_socket_events(sio):

    @sio.event
    async def connect(sid, environ):
        print(f"✅ 연결됨: {sid}")

    @sio.event
    async def disconnect(sid):
        sender_id = sid_to_user.get(sid)
        room_id = sid_to_room.get(sid)
        if sender_id and room_id:
            await sio.emit("user_left", {"sender_id": sender_id}, room=room_id)
        sid_to_user.pop(sid, None)
        sid_to_room.pop(sid, None)

    @sio.event
    async def join_room(sid, data):
        room_id = data["room_id"]
        sender_id = data.get("sender_id")
        name = get_student_name(sender_id)

        await sio.enter_room(sid, room_id)
        sid_to_user[sid] = sender_id
        sid_to_room[sid] = room_id

        participants = build_participants(sid_to_user, sid_to_room, room_id)

        await sio.emit("current_users", {"participants": participants}, room=sid)
        await sio.emit("user_joined", {"sender_id": sender_id, "name": name}, room=room_id)

    async def emit_message(room_id, sender_id, name, msg, role="user", target=None, is_gpt_question=False):
        payload = {
            "sender_id": sender_id,
            "name": name,
            "message": msg,
            "role": role,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "is_gpt_question": is_gpt_question
        }
        if target:
            payload["target"] = target
            for sid, uid in sid_to_user.items():
                if uid == target:
                    await sio.emit("receive_message", payload, to=sid)
                    return
        else:
            await sio.emit("receive_message", payload, room=room_id)

    @sio.event
    async def send_message(sid, data):
        room_id = data["room_id"]
        sender_id = data["sender_id"]
        msg = data["message"]
        is_gpt_question = data.get("target") == "gpt"
        timestamp = datetime.datetime.utcnow().isoformat()
        name = get_student_name(sender_id)

        # 메시지 저장
        await save_message_to_db(room_id, sender_id, msg, "user", timestamp)

        # 사용자 메시지 전송
        await emit_message(room_id, sender_id, name, msg, "user", None, is_gpt_question)

        # ✅ GPT 직접 호출 처리
        if is_gpt_question:
            print(f"📣 GPT 버튼 호출 by {sender_id}")
            history = await get_room_history(room_id)
            gpt_text = await GPTInterventionService(room_id).generate_feedback(
                recent_messages=history[-10:], intervention_type="intervene", target=None
            )
            gpt_time = datetime.datetime.utcnow().isoformat()
            await save_message_to_db(room_id, "gpt", gpt_text, "assistant", gpt_time)
            await emit_message(room_id, "gpt", None, gpt_text, "assistant")

        # 최근 메시지 누적
        if room_id not in recent_messages:
            recent_messages[room_id] = []
        recent_messages[room_id].append({
            "sender_id": sender_id,
            "message": msg,
            "timestamp": timestamp,
            "name": name
        })

        # 자동 개입 판단
        if len(recent_messages[room_id]) >= MESSAGE_LIMIT:
            print(f"🧠 GPT 자동 개입 실행: {room_id}")
            buffer = recent_messages[room_id]
            recent_messages[room_id] = []

            gpt_service = GPTInterventionService(room_id)
            await gpt_service.process_auto_intervention(buffer, sid_to_user, sio)

    @sio.event
    async def get_messages(sid, data):
        room_id = data.get("room_id")
        if not room_id:
            return
        history = await get_room_history(room_id)
        for msg in history:
            if msg["sender_id"] != "gpt":
                msg["name"] = get_student_name(msg["sender_id"])
        await sio.emit("message_history", history, room=sid)