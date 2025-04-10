import datetime
from supabase_client import save_message_to_db, get_room_history
from gpt_handler import gpt_should_respond, gpt_generate_response

sid_to_user = {}
sid_to_room = {}
recent_messages = {}  # room_id → [messages]
MESSAGE_LIMIT = 3

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
        await sio.enter_room(sid, room_id)
        sid_to_user[sid] = sender_id
        sid_to_room[sid] = room_id

        participants = list({v for k, v in sid_to_user.items() if sid_to_room.get(k) == room_id})
        await sio.emit("current_users", {"participants": participants}, room=sid)
        await sio.emit("user_joined", {"sender_id": sender_id}, room=room_id)

    @sio.event
    async def send_message(sid, data):
        room_id = data["room_id"]
        sender_id = data["sender_id"]
        msg = data["message"]
        timestamp = datetime.datetime.utcnow().isoformat()

        # 메시지 저장
        await save_message_to_db(room_id, sender_id, msg, "user", timestamp)

        # 사용자 메시지 브로드캐스트
        await sio.emit("receive_message", {
            "sender_id": sender_id,
            "message": msg,
            "role": "user",
            "timestamp": timestamp
        }, room=room_id)

        # @GPT 직접 호출 처리
        if "@GPT" in msg or "GPT야" in msg:
            print(f"📣 GPT 직접 호출됨 by {sender_id}")
            history = await get_room_history(room_id)
            gpt_text = await gpt_generate_response(history[-10:], target=None, room_id=room_id)

            gpt_time = datetime.datetime.utcnow().isoformat()
            await save_message_to_db(room_id, "gpt", gpt_text, "assistant", gpt_time)

            await sio.emit("receive_message", {
                "sender_id": "gpt",
                "message": gpt_text,
                "role": "assistant",
                "timestamp": gpt_time
            }, room=room_id)
            return

        # recent_messages 누적
        if room_id not in recent_messages:
            recent_messages[room_id] = []
        recent_messages[room_id].append({
            "sender_id": sender_id,
            "message": msg,
            "timestamp": timestamp
        })

        # 판단 조건 도달 시
        if len(recent_messages[room_id]) >= MESSAGE_LIMIT:
            print(f"🧠 GPT 개입 판단 요청: {room_id}")
            judgment = await gpt_should_respond(recent_messages[room_id], room_id)
            recent_messages[room_id] = []

            if not judgment.get("should_respond"):
                return

            target = judgment.get("target")
            gpt_text = await gpt_generate_response(recent_messages[room_id], target, room_id)
            gpt_time = datetime.datetime.utcnow().isoformat()

            await save_message_to_db(room_id, "gpt", gpt_text, "assistant", gpt_time)

            if target:
                # 귓속말
                for sid_iter, uid in sid_to_user.items():
                    if uid == target:
                        await sio.emit("receive_message", {
                            "sender_id": "gpt",
                            "message": gpt_text,
                            "role": "assistant",
                            "timestamp": gpt_time,
                            "target": target
                        }, to=sid_iter)
                        break
            else:
                # 전체 broadcast
                await sio.emit("receive_message", {
                    "sender_id": "gpt",
                    "message": gpt_text,
                    "role": "assistant",
                    "timestamp": gpt_time
                }, room=room_id)

    @sio.event
    async def get_messages(sid, data):
        room_id = data.get("room_id")
        if not room_id:
            return
        history = await get_room_history(room_id)
        await sio.emit("message_history", history, room=sid)