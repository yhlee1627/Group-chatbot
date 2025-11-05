import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./chatStyles";
import { getUserColor } from "./chatUtils";
import theme from "../../styles/theme";
import { formatTimestamp } from "./chatUtils";

function MessageList({ messages, studentId, isAdmin = false }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        const time = msg.timestamp ? formatTimestamp(msg.timestamp) : "";

        const containerStyle = {
          ...styles.messageContainer,
          justifyContent: isMyMessage ? "flex-end" : "flex-start",
        };

        // 모바일일 때 컨테이너 스타일 조정
        if (isMobile) {
          Object.assign(containerStyle, {
            ...styles.mobileMessageContainer,
            marginBottom: "16px" // 모바일에서 메시지 간격 조정
          });
        }

        const bubbleStyle = {
          ...styles.bubbleBase,
          ...(isMyMessage
            ? {
                ...styles.bubbleMyMessage,
                borderBottomRightRadius: "4px" // 내 메시지는 오른쪽 하단만 각진 모서리
              }
            : isGPT
            ? isWhisper
              ? {
                  ...styles.bubbleGptWhisper,
                  borderBottomLeftRadius: "4px" // GPT 귓속말은 왼쪽 하단만 각진 모서리
                }
              : {
                  ...styles.bubbleGptPublic,
                  borderBottomLeftRadius: "4px" // GPT 일반 메시지는 왼쪽 하단만 각진 모서리
                }
            : {
                ...styles.bubbleOther,
                borderBottomLeftRadius: "4px" // 다른 사람 메시지는 왼쪽 하단만 각진 모서리
              }),
        };

        // 모바일에서 말풍선 너비 조정
        if (isMobile) {
          Object.assign(bubbleStyle, {
            ...styles.mobileBubble,
            maxWidth: isMyMessage ? "80%" : "75%", // 모바일에서 말풍선 너비 제한
            padding: "8px 12px", // 패딩 조정
            borderRadius: "16px", // 기본 모서리 둥글기
            // 메시지 유형에 따라 한쪽 모서리만 각지게 유지
            ...(isMyMessage ? { borderBottomRightRadius: "4px" } : { borderBottomLeftRadius: "4px" })
          });
        }

        const avatarStyle = {
          ...styles.avatar,
          ...(isGPT ? styles.gptAvatar : {})
        };

        // 모바일에서 아바타 크기 조정
        if (isMobile) {
          Object.assign(avatarStyle, {
            width: "28px",
            height: "28px",
            fontSize: "14px",
            minWidth: "28px" // 아바타 크기 고정
          });
        }

        const avatarEmoji = isGPT ? "✨" : "👤";

        const timeStyle = {
          ...styles.timestamp,
          textAlign: isMyMessage ? "right" : "left",
          // 모바일에서 타임스탬프 스타일 조정
          ...(isMobile && {
            fontSize: "10px",
            marginTop: "4px"
          })
        };

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
                  ...(isMobile && { fontSize: "12px", marginBottom: "4px" }) // 모바일에서 이름 크기 조정
                }}
              >
                {sender}
              </div>

              {isWhisper && (
                <div style={{
                  ...styles.badgeBase,
                  ...styles.whisperBadge,
                  ...(isMobile && { fontSize: "10px", padding: "1px 6px", marginBottom: "4px" }) // 모바일에서 배지 크기 조정
                }}>
                  🤫 {studentId}님에게만
                </div>
              )}

              {msg.is_gpt_question && (
                <div style={{
                  ...styles.badgeBase,
                  ...styles.gptBadge,
                  ...(isMobile && { fontSize: "10px", padding: "1px 6px", marginBottom: "4px" }) // 모바일에서 배지 크기 조정
                }}>
                  GPT에게 질문
                </div>
              )}

              <div style={{ 
                lineHeight: 1.5,
                ...(isMobile && { fontSize: "14px" }) // 모바일에서 메시지 텍스트 크기 조정
              }}>
                {msg.message}
              </div>
              
              {isAdmin && isGPT && msg.reasoning && (
                <div style={{
                  ...styles.reasoningContainer,
                  ...(isMobile && { padding: "8px", marginTop: "8px", fontSize: "12px" }) // 모바일에서 reasoning 컨테이너 조정
                }}>
                  <div style={styles.reasoningTitle}>
                    <span>🧠</span> GPT 판단 이유:
                  </div>
                  <div style={styles.reasoningText}>{msg.reasoning}</div>
                </div>
              )}

              {time && (
                <div style={timeStyle}>
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