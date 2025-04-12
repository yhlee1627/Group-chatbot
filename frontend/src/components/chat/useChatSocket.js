import { useEffect } from "react";
import { socket } from "../../socket";

export function useChatSocket({ studentId, roomId, setMessages, setParticipants, addSystemMessage }) {
  useEffect(() => {
    if (!studentId || !roomId) return;

    socket.connect();
    socket.emit("join_room", { room_id: roomId, sender_id: studentId });
    socket.emit("get_messages", { room_id: roomId });

    socket.on("message_history", (history) => setMessages(history));
    socket.on("receive_message", (data) => setMessages((prev) => [...prev, data]));
    socket.on("current_users", ({ participants }) => setParticipants(participants));
    socket.on("user_joined", ({ sender_id }) => {
      console.log("✅ user_joined 이벤트 감지:", sender_id); // 추가
      setParticipants((prev) => prev.includes(sender_id) ? prev : [...prev, sender_id]);
      if (sender_id !== studentId) {
        console.log("✅ 시스템 메시지 추가 직전"); // 추가
        addSystemMessage(`🟢 ${sender_id}님이 입장했습니다.`);
      }
    });
    
    socket.on("user_left", ({ sender_id }) => {
      console.log("✅ user_left 이벤트 감지:", sender_id); // 추가
      setParticipants((prev) => prev.filter((id) => id !== sender_id));
      addSystemMessage(`🔴 ${sender_id}님이 퇴장했습니다.`);
    });

    return () => {
      socket.disconnect();
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("current_users");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [studentId, roomId]);
}