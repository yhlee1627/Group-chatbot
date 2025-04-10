import React from "react";
import { getUserColor } from "./chatUtils";

function MessageList({ messages, studentId }) {
  return messages.map((msg, i) => {
    if (msg.role === "system") {
      return (
        <div key={i} style={{ textAlign: "center", color: "#888", margin: "8px 0" }}>
          {msg.message}
        </div>
      );
    }

    const isMyMessage = msg.sender_id === studentId;
    const isGPT = msg.role === "assistant";
    const sender = isGPT ? "🤖 GPT" : `🧑‍🎓 ${msg.sender_id}`;
    const date = new Date(msg.timestamp);
    const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <div
        key={i}
        style={{
          display: "flex",
          justifyContent: isMyMessage ? "flex-end" : "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            backgroundColor: isMyMessage ? "#DCF8C6" : isGPT ? "#F0F4FF" : "#F3F3F3",
            padding: "12px 16px",
            borderRadius: "16px",
            maxWidth: "70%",
          }}
        >
          <div style={{
            fontSize: "13px",
            color: getUserColor(msg.sender_id),
            marginBottom: "4px",
            textAlign: isMyMessage ? "right" : "left",
          }}>
            {sender}
          </div>
          <div>{msg.message}</div>
          <div style={{ fontSize: "11px", color: "#999", textAlign: isMyMessage ? "right" : "left" }}>
            {timeString}
          </div>
        </div>
      </div>
    );
  });
}

export default MessageList;