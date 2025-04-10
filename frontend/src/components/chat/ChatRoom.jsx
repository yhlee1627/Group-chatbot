import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";
import MessageList from "./MessageList";
import InputBox from "./InputBox";

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState("");
  const [roomTitle, setRoomTitle] = useState("채팅방"); // ✅ room title 상태

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const roomId = localStorage.getItem("roomId");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!studentId || !roomId) {
      alert("로그인 정보가 없습니다.");
      navigate("/student-login");
      return;
    }

    socket.connect();
    socket.emit("join_room", { room_id: roomId, sender_id: studentId });
    socket.emit("get_messages", { room_id: roomId });

    socket.on("message_history", (history) => {
      setMessages(history);
    });

    socket.on("receive_message", (msg) => {
      if (msg.target && msg.target !== studentId) return;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("current_users", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("user_joined", ({ sender_id }) => {
      setParticipants((prev) => (prev.includes(sender_id) ? prev : [...prev, sender_id]));
    });

    socket.on("user_left", ({ sender_id }) => {
      setParticipants((prev) => prev.filter((id) => id !== sender_id));
    });

    // ✅ 방 제목 불러오기
    fetch(`${import.meta.env.VITE_BACKEND_URL}/rooms?room_id=eq.${roomId}`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setRoomTitle(data?.[0]?.title || "채팅방");
      });

    return () => {
      socket.disconnect();
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("current_users");
    };
  }, []);

  const sendMessage = (text) => {
    socket.emit("send_message", {
      room_id: roomId,
      sender_id: studentId,
      message: text
    });
  };

  const leaveRoom = () => {
    navigate("/student");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{roomTitle}</h2>
        <button onClick={leaveRoom} style={styles.leaveButton}>방 나가기</button>
      </div>

      <div style={styles.messageArea}>
        <MessageList messages={messages} studentId={studentId} />
        <div ref={messagesEndRef} />
      </div>

      <InputBox input={input} setInput={setInput} onSend={sendMessage} />

      <div style={styles.participants}>
        👥 참여자:{" "}
        {participants.map((id, i) => (
          <span key={i} style={{
            marginRight: "0.5rem",
            fontWeight: id === studentId ? "bold" : "normal",
            color: id === studentId ? "#007AFF" : "#555"
          }}>
            {id === "gpt" ? "🤖 GPT" : id}
          </span>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1.5rem",
    maxWidth: "1000px",
    margin: "auto",
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#333",
  },
  leaveButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  messageArea: {
    height: "60vh",
    overflowY: "auto",
    border: "1px solid #ddd",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    marginBottom: "1rem",
    borderRadius: "10px",
  },
  participants: {
    marginTop: "1rem",
    fontSize: "14px",
    color: "#555",
  },
};

export default ChatRoom;