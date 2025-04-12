import React from "react";
import styles from "./chatStyles";
import { getUserColor } from "./chatUtils";

function MessageList({ messages, studentId, isAdmin = false }) {
  return messages.map((msg, i) => {
    if (msg.type === "system") {
      return (
        <div key={i} style={styles.systemMessage}>
          {msg.message}
        </div>
      );
    }

    const isGPT = msg.sender_id === "gpt";
    const isMyMessage = msg.sender_id === studentId;
    const isWhisper = isGPT && msg.target && msg.target === studentId;
    const isPublicGpt = isGPT && !msg.target;
    const isGptToOthers = isGPT && msg.target && msg.target !== studentId;
    const showAdminLog = isAdmin && isGptToOthers;

    const senderName = msg.name ?? msg.sender_id;
    const sender = isGPT ? "🤖 GPT" : `🧑‍🎓 ${senderName}`;

    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const containerStyle = {
      ...styles.messageContainer,
      justifyContent: isMyMessage ? "flex-end" : "flex-start",
    };

    const bubbleStyle = {
      ...styles.bubbleBase,
      ...(isMyMessage
        ? styles.bubbleMyMessage
        : isGPT
        ? isWhisper
          ? styles.bubbleGptWhisper
          : styles.bubbleGptPublic
        : styles.bubbleOther),
    };

    return (
      <React.Fragment key={i}>
        {showAdminLog && (
          <div style={styles.systemMessage}>
            GPT가 {msg.target} 학생에게 귓속말을 보냈습니다.
          </div>
        )}
        <div style={containerStyle}>
          <div style={bubbleStyle}>
            <div
              style={{
                ...styles.senderLabel,
                color: getUserColor(msg.sender_id),
                textAlign: isMyMessage ? "right" : "left",
              }}
            >
              {sender}
            </div>

            {/* 🤫 GPT 귓속말 라벨 */}
            {isWhisper && (
              <div style={styles.whisperLabel}>🤫 GPT가 너에게만 하는 말이야</div>
            )}

            {/* 💬 GPT 질문 표시 */}
            {msg.is_gpt_question && (
              <div style={{ color: "#007AFF", fontWeight: "bold", marginBottom: "4px" }}>
                [GPT에게 질문]
              </div>
            )}

            <div>{msg.message}</div>

            {time && (
              <div
                style={{
                  ...styles.timestamp,
                  textAlign: isMyMessage ? "right" : "left",
                }}
              >
                {time}
              </div>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  });
}

export default MessageList;