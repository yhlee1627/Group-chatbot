import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const studentId = localStorage.getItem("studentId");
  const nickname = localStorage.getItem("nickname") || studentId;
  const roomId = localStorage.getItem("roomId");

  const userColors = [
    "#1f77b4", "#2ca02c", "#d62728", "#9467bd", "#ff7f0e",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];

  const getUserColor = (sender_id) => {
    if (!sender_id) return "#888";
    let hash = 0;
    for (let i = 0; i < sender_id.length; i++) {
      hash = sender_id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % userColors.length;
    return userColors[index];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!studentId || !roomId) {
      alert("로그인 정보가 없습니다.");
      navigate("/student");
      return;
    }

    socket.connect();

    // ✅ sender_id 포함하여 서버에 입장 요청
    socket.emit("join_room", {
      room_id: roomId,
      sender_id: studentId,
    });

    socket.emit("get_messages", { room_id: roomId });

    socket.on("message_history", (history) => {
      setMessages(history);
    });

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // ✅ 입장 후 현재 참여자 전체 목록 수신
    socket.on("current_users", ({ participants }) => {
      setParticipants(participants);
    });

    // ✅ 누군가 입장했을 때
    socket.on("user_joined", ({ sender_id }) => {
      setParticipants((prev) => {
        if (!prev.includes(sender_id)) return [...prev, sender_id];
        return prev;
      });
    });

    // ✅ 누군가 퇴장했을 때
    socket.on("user_left", ({ sender_id }) => {
      setParticipants((prev) => prev.filter((id) => id !== sender_id));
    });

    return () => {
      socket.disconnect();
      socket.off("receive_message");
      socket.off("message_history");
      socket.off("current_users");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, []);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    socket.emit("send_message", {
      room_id: roomId,
      sender_id: studentId,
      message: trimmed,
    });

    setInput("");
  };

  const leaveRoom = () => {
    navigate("/student");
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "1000px", margin: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0 }}>채팅방</h2>
        <button
          onClick={leaveRoom}
          style={{
            padding: "0.4rem 0.8rem",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          방 나가기
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "60vh",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg, i) => {
          const isMyMessage = msg.sender_id === studentId;
          const isGPT = msg.role === "assistant";
          const sender = isGPT ? "GPT" : `${msg.sender_id || "이름없음"}`;
          const date = new Date(msg.timestamp);
          const timeString = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isMyMessage ? "flex-end" : "flex-start",
                marginBottom: "1rem",
                animation: "fadeInUp 0.3s ease",
              }}
            >
              <div
                style={{
                  backgroundColor: isMyMessage
                    ? "#DCF8C6"
                    : isGPT
                    ? "#F0F4FF"
                    : "#F3F3F3",
                  color: "#1A1A1A",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  maxWidth: "70%",
                  fontSize: "15px",
                  fontWeight: 500,
                  lineHeight: "1.5",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: isMyMessage
                      ? "#4A90E2"
                      : getUserColor(msg.sender_id),
                    marginBottom: "4px",
                    fontWeight: isMyMessage ? "bold" : "normal",
                    textAlign: isMyMessage ? "right" : "left",
                  }}
                >
                  {sender}
                </div>
                <div>{msg.message}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "6px",
                    textAlign: isMyMessage ? "right" : "left",
                  }}
                >
                  {timeString}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          style={{
            flexGrow: 1,
            marginRight: "1rem",
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "15px",
            minWidth: "60%",
          }}
          placeholder="메시지를 입력하세요..."
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            backgroundColor: "#4A90E2",
            color: "white",
            border: "none",
            fontSize: "15px",
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          보내기
        </button>
      </div>

      <div style={{ fontSize: "14px", color: "#555" }}>
        참여자:{" "}
        {participants.map((id, idx) => (
          <span
            key={idx}
            style={{
              marginRight: "0.5rem",
              color: id === studentId ? "#4A90E2" : getUserColor(id),
              fontWeight: id === studentId ? "bold" : "normal",
            }}
          >
            {id === "gpt" ? "GPT" : id}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ChatRoom;