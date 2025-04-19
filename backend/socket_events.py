import datetime
from supabase_client import (
    save_message_to_db,
    get_room_history,
    get_student_name,
    save_gpt_intervention
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
            name = get_student_name(sender_id)
            await sio.emit("user_left", {"sender_id": sender_id, "name": name}, room=room_id)
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

    async def emit_message(room_id, sender_id, name, msg, role="user", whisper_to=None, is_gpt_question=False, feedback_type=None, reasoning=""):
        """
        메시지를 클라이언트에 전송하는 유틸리티 함수
        - room_id: 채팅방 ID
        - sender_id: 보낸 사람 ID 
        - name: 보낸 사람 이름
        - msg: 메시지 내용
        - role: 역할 ("user", "assistant", "system")
        - whisper_to: 귓속말 대상 (특정 학생에게만 보이는 메시지)
        - is_gpt_question: GPT에게 직접 질문한 경우
        - feedback_type: GPT 피드백 유형 ("positive", "guidance", "direct_response", "individual")
        - reasoning: GPT의 판단 이유나 응답 맥락
        """
        payload = {
            "sender_id": sender_id,
            "message": msg,
            "role": role,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "is_gpt_question": is_gpt_question
        }
        
        if name:
            payload["name"] = name
            
        if feedback_type:
            payload["feedback_type"] = feedback_type
            
        if reasoning:
            payload["reasoning"] = reasoning
            
        if whisper_to:
            payload["whisper"] = True
            payload["target"] = whisper_to
            
            # 귓속말은 특정 학생에게만 전송
            for sid, uid in sid_to_user.items():
                if uid == whisper_to:
                    await sio.emit("receive_message", payload, to=sid)
                    return
        else:
            # 일반 메시지는 방 전체에 전송
            await sio.emit("receive_message", payload, room=room_id)

    @sio.event
    async def send_message(sid, data):
        room_id = data["room_id"]
        sender_id = data["sender_id"]
        msg = data["message"]
        is_gpt_question = data.get("is_gpt_question", False)
        timestamp = datetime.datetime.utcnow().isoformat()
        name = get_student_name(sender_id)

        # 메시지 저장
        await save_message_to_db(room_id, sender_id, msg, "user", timestamp)

        # 사용자 메시지 전송
        await emit_message(room_id, sender_id, name, msg, "user", None, is_gpt_question)

        # ✅ GPT 직접 호출 처리 (시나리오 2)
        if is_gpt_question:
            print(f"📣 GPT 질문 요청 by {sender_id}: '{msg}'")
            history = await get_room_history(room_id)
            
            # GPT 서비스 초기화
            gpt_service = GPTInterventionService(room_id)
            
            # 직접 질문에 대한 응답 생성 함수 사용
            gpt_text = await gpt_service.generate_direct_response(
                recent_messages=history[-10:],
                student_question=msg,
                student_id=sender_id
            )
            
            gpt_time = datetime.datetime.utcnow().isoformat()
            
            # 응답 저장 (reasoning 필드에 "직접 질문에 대한 응답" 추가)
            response = await save_message_to_db(
                room_id, 
                "gpt", 
                gpt_text, 
                "assistant", 
                gpt_time, 
                reasoning="직접 질문에 대한 응답"
            )
            
            # 응답 전송 (feedback_type을 "direct_response"로 설정)
            await emit_message(
                room_id, 
                "gpt", 
                None, 
                gpt_text, 
                "assistant", 
                None, 
                False, 
                "direct_response",
                "직접 질문에 대한 응답"
            )
            
            # 교사 대시보드용 개입 로그 저장
            if response:
                try:
                    # message_id 추출
                    message_id = None
                    if isinstance(response, dict):
                        message_id = response.get("message_id")
                    elif isinstance(response, list) and len(response) > 0:
                        message_id = response[0].get("message_id")
                    
                    if message_id:
                        from db_utils import save_gpt_intervention as db_save_intervention
                        await db_save_intervention(
                            room_id, 
                            message_id, 
                            "direct_response", 
                            target_student=sender_id, 
                            reasoning="직접 질문에 대한 응답"
                        )
                except Exception as e:
                    print(f"❌ 직접 질문 개입 로그 저장 실패: {e}")
            
            return

        # 최근 메시지 누적 (자동 개입용)
        if room_id not in recent_messages:
            recent_messages[room_id] = []
        recent_messages[room_id].append({
            "sender_id": sender_id,
            "message": msg,
            "timestamp": timestamp,
            "name": name
        })

        # 자동 개입 판단 (시나리오 1) - 메시지가 일정 개수 누적되면 실행
        if len(recent_messages[room_id]) >= MESSAGE_LIMIT:
            print(f"🧠 GPT 자동 개입 분석 시작: {room_id}")
            buffer = recent_messages[room_id]
            recent_messages[room_id] = []

            gpt_service = GPTInterventionService(room_id)
            judgment = await gpt_service.should_respond(buffer)
            
            if judgment.get("should_respond", False):
                intervention_type = judgment.get("intervention_type", "guidance")
                target = judgment.get("target_student") or judgment.get("target")
                
                # 타겟 스튜던트 ID 확인 및 수정
                if target and not target.startswith("2s"):
                    # 이름에서 ID를 찾기 위한 로직
                    try:
                        for msg in buffer:
                            if msg.get("name") == target or msg.get("name") == f"학생{target}":
                                target = msg.get("sender_id")
                                break
                    except Exception as e:
                        print(f"❌ 타겟 스튜던트 ID 변환 중 오류: {e}")
                
                reasoning = judgment.get("reasoning", "")
                
                print(f"🤖 GPT 개입 결정: {intervention_type} 유형" + (f" ({target}에게)" if target else ""))
                
                gpt_text = await gpt_service.generate_feedback(buffer, intervention_type, target)
                gpt_time = datetime.datetime.utcnow().isoformat()
                
                # 응답 저장 (귓속말인 경우 whisper_to 설정)
                message_response = await save_message_to_db(
                    room_id, "gpt", gpt_text, "assistant", gpt_time, 
                    whisper_to=target if intervention_type == "individual" else None,
                    reasoning=reasoning
                )
                
                # GPT 개입 로그 저장 (교사 확인용)
                if message_response:
                    try:
                        # message_id 추출 방식 수정
                        message_id = None
                        print(f"✅ 메시지 응답: {message_response}")
                        
                        if isinstance(message_response, dict):
                            message_id = message_response.get("message_id")
                        elif isinstance(message_response, list) and len(message_response) > 0:
                            message_id = message_response[0].get("message_id")
                        
                        # 유효한 message_id가 없는 경우 개입 로그 저장 시도하지 않음
                        if not message_id:
                            print("❌ 메시지 ID를 찾을 수 없어 개입 로그를 저장하지 않습니다.")
                            
                        else:
                            # 수파베이스 클라이언트 대신 db_utils 임포트
                            from db_utils import save_gpt_intervention as db_save_intervention
                            intervention_result = await db_save_intervention(
                                room_id, 
                                message_id, 
                                intervention_type, 
                                target_student=target, 
                                reasoning=reasoning
                            )
                            
                            if not intervention_result:
                                print("❌ 개입 로그 저장 결과가 없습니다.")
                    except Exception as e:
                        print(f"❌ GPT 개입 로그 저장 실패: {e}")
                        import traceback
                        traceback.print_exc()
                
                # 응답 전송
                await emit_message(
                    room_id, "gpt", None, gpt_text, "assistant", 
                    whisper_to=target if intervention_type == "individual" else None,
                    feedback_type=intervention_type,
                    reasoning=reasoning
                )
            else:
                print("🤖 GPT 판단: 개입 불필요")

    @sio.event
    async def get_messages(sid, data):
        room_id = data.get("room_id")
        sender_id = sid_to_user.get(sid)
        
        if not room_id:
            return
            
        history = await get_room_history(room_id)
        
        # 귓속말 필터링: 본인에게 온 귓속말만 표시
        filtered_history = []
        for msg in history:
            # 귓속말이 아니거나 본인에게 온 귓속말인 경우만 표시
            if "whisper_to" not in msg or not msg["whisper_to"] or msg["whisper_to"] == sender_id:
                if msg["sender_id"] != "gpt":
                    msg["name"] = get_student_name(msg["sender_id"])
                    
                # 클라이언트에 whisper 플래그 추가
                if "whisper_to" in msg and msg["whisper_to"]:
                    msg["whisper"] = True
                    
                filtered_history.append(msg)
                
        await sio.emit("message_history", filtered_history, room=sid)