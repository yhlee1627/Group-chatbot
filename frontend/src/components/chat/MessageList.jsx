import React from "react";
import { motion } from "framer-motion";
import styles from "./chatStyles";
import { getUserColor } from "./chatUtils";
import theme from "../../styles/theme";

function MessageList({ messages, studentId, isAdmin = false }) {
  return (
    <div style={styles.messageList}>
      {messages.map((msg, index) => {
        if (msg.type === "system") {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
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

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          Object.assign(containerStyle, styles.mobileMessageContainer);
        }

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

        if (isMobile) {
          Object.assign(bubbleStyle, styles.mobileBubble);
        }

        const avatarStyle = {
          ...styles.avatar,
          ...(isMobile ? styles.mobileAvatar : {}),
          ...(isGPT ? styles.gptAvatar : {})
        };

        const avatarEmoji = isGPT ? "🤖" : "👤";

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={containerStyle}
          >
            {!isMyMessage && (
              <div style={avatarStyle}>{avatarEmoji}</div>
            )}
            <div style={bubbleStyle}>
              <div
                style={{
                  ...styles.senderLabel,
                  color: isGPT ? "#0073E6" : theme.NEUTRAL_TEXT,
                  textAlign: isMyMessage ? "right" : "left",
                }}
              >
                {sender}
              </div>

              {isWhisper && (
                <div style={{
                  ...styles.badgeBase,
                  ...styles.whisperBadge,
                }}>
                  🤫 {studentId}님에게만
                </div>
              )}

              {msg.is_gpt_question && (
                <div style={{
                  ...styles.badgeBase,
                  ...styles.gptBadge,
                }}>
                  GPT에게 질문
                </div>
              )}

              <div style={{ lineHeight: 1.5 }}>{msg.message}</div>
              
              {isAdmin && isGPT && msg.reasoning && (
                <div style={styles.reasoningContainer}>
                  <div style={styles.reasoningTitle}>
                    <span>🧠</span> GPT 판단 이유:
                  </div>
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
            {isMyMessage && (
              <div style={avatarStyle}>{avatarEmoji}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default MessageList;