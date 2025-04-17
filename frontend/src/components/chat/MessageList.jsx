import React from "react";
import { motion } from "framer-motion";
import styles from "./chatStyles";
import { getUserColor } from "./chatUtils";

function MessageList({ messages, studentId, isAdmin = false }) {
  return (
    <div style={styles.messageList}>
      {messages.map((msg, index) => {
        if (msg.type === "system") {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={styles.systemMessage}
            >
              {msg.message}
            </motion.div>
          );
        }

        const isGPT = msg.sender_id === "gpt";
        const isMyMessage = msg.sender_id === studentId;
        const isWhisper = isGPT && msg.target && msg.target === studentId;
        const isPublicGpt = isGPT && !msg.target;
        const isGptToOthers = isGPT && msg.target && msg.target !== studentId;
        const showAdminLog = isAdmin && isGptToOthers;

        const senderName = msg.name ?? msg.sender_id;
        const sender = isGPT ? "GPT" : `${senderName}`;

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
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={containerStyle}
          >
            {msg.sender_id !== studentId && (
              <div style={styles.avatar}>👤</div>
            )}
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
                <div style={styles.whisperLabel}>GPT가 너에게만 하는 말이야</div>
              )}

              {/* 💬 GPT 질문 표시 */}
              {msg.is_gpt_question && (
                <div style={{ color: "#0095F6", fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>
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
            {msg.sender_id === studentId && (
              <div style={styles.avatar}>👤</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default MessageList;