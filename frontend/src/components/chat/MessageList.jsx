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
        const isMyMessage = msg.isFromMe || msg.sender_id === studentId;
        
        // 귓속말 확인 - whisper_to 또는 whisper+target 조합 확인
        // 모든 방식의 귓속말을 다 확인 - 백엔드가 여러 형태로 보낼 수 있음
        const isWhisper = isGPT && (
          msg.whisper_to === studentId || 
          (msg.whisper === true && msg.target === studentId) || 
          (msg.target === studentId && !msg.whisper_to && !msg.whisper)
        );
        
        // 개발자 디버깅: 모든 필드 콘솔에 표시
        if (isGPT) {
          console.log('🔍 메시지 디버깅:', {
            whisper_to: msg.whisper_to, 
            target: msg.target,
            whisper: msg.whisper,
            isWhisper: isWhisper,
            studentId: studentId
          });
        }
        
        const isPublicGpt = isGPT && !msg.target && !msg.whisper_to && !msg.whisper;
        const isGptToOthers = isGPT && !isWhisper && !isPublicGpt;
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
                <div style={{
                  ...styles.whisperLabel,
                  padding: "4px 8px",
                  backgroundColor: "#FFF3D9",
                  borderRadius: "4px",
                  display: "inline-block"
                }}>
                  🤫 GPT가 {studentId}님에게만 보내는 메시지
                </div>
              )}

              {/* 💬 GPT 질문 표시 */}
              {msg.is_gpt_question && (
                <div style={{ color: "#0095F6", fontWeight: "600", marginBottom: "4px", fontSize: "12px" }}>
                  [GPT에게 질문]
                </div>
              )}

              <div>{msg.message}</div>
              
              {/* 🧠 관리자에게만 reasoning 표시 */}
              {isAdmin && isGPT && msg.reasoning && (
                <div style={styles.reasoningContainer}>
                  <div style={styles.reasoningTitle}>GPT 판단 이유:</div>
                  <div style={styles.reasoningText}>{msg.reasoning}</div>
                </div>
              )}

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