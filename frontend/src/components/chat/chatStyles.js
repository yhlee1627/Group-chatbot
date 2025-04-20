import theme from "../../styles/theme";

const styles = {
  // 💬 메시지 리스트 컨테이너
  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
  },

  // 💬 전체 메시지 묶음 컨테이너 (좌우 정렬)
  messageContainer: {
    display: "flex",
    width: "100%",
    marginBottom: "1rem",
    alignItems: "flex-end",
    gap: "8px",
  },

  // 모바일용 메시지 컨테이너
  mobileMessageContainer: {
    marginBottom: "14px",
    maxWidth: "100%",
    gap: "6px",
  },

  // 💬 말풍선 기본 스타일
  bubbleBase: {
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 18px",
    maxWidth: "75%",
    wordBreak: "break-word",
    lineHeight: "1.5",
    fontSize: "15px",
    boxShadow: theme.SHADOW_SM,
    transition: "box-shadow 0.2s ease",
    position: "relative",
  },

  // 모바일용 말풍선 기본 스타일
  mobileBubble: {
    padding: "8px 12px",
    borderRadius: "16px 16px 16px 16px",
    fontSize: "14px",
    maxWidth: "75%",
  },

  // 🧑‍🎓 내가 보낸 메시지 (오른쪽)
  bubbleMyMessage: {
    backgroundColor: theme.MAIN_LIGHT,
    color: theme.NEUTRAL_TEXT,
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    borderBottomLeftRadius: "18px",
    borderBottomRightRadius: "4px",
    border: `1px solid rgba(130, 124, 209, 0.2)`,
    position: "relative",
    "&:hover": {
      boxShadow: theme.SHADOW_MD,
    },
  },

  // 🧑‍🎓 다른 학생이 보낸 메시지 (왼쪽)
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    color: theme.NEUTRAL_TEXT,
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "18px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    "&:hover": {
      boxShadow: theme.SHADOW_MD,
    },
  },

  // 🤖 GPT 전체 대상 메시지
  bubbleGptPublic: {
    backgroundColor: "#F2F7FF",
    color: theme.NEUTRAL_TEXT,
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "18px",
    border: "1px solid #E8F1FF",
    boxShadow: "0 2px 4px rgba(42, 82, 190, 0.05)",
    "&:hover": {
      boxShadow: "0 3px 8px rgba(42, 82, 190, 0.1)",
    },
  },

  // 🤖 GPT 귓속말 메시지
  bubbleGptWhisper: {
    backgroundColor: "#FFF9F0",
    border: "1px solid #FFE3B3",
    color: theme.NEUTRAL_TEXT,
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    borderBottomLeftRadius: "4px",
    borderBottomRightRadius: "18px",
    boxShadow: "0 2px 4px rgba(252, 169, 2, 0.05)",
    "&:hover": {
      boxShadow: "0 3px 8px rgba(252, 169, 2, 0.1)",
    },
  },

  // 🧑‍🏫 보낸 사람 이름 (말풍선 상단)
  senderLabel: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    color: theme.NEUTRAL_TEXT,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // 🕒 타임스탬프 (말풍선 하단)
  timestamp: {
    fontSize: "11px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    marginTop: "6px",
    opacity: 0.8,
  },

  // 🤫 GPT 귓속말 안내 라벨
  whisperLabel: {
    fontSize: "12px",
    color: "#cc8800",
    fontWeight: "600",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // 🧠 GPT reasoning 컨테이너
  reasoningContainer: {
    marginTop: "12px",
    padding: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: "8px",
    fontSize: "13px",
    border: "1px solid rgba(0, 0, 0, 0.06)",
  },

  // 🧠 GPT reasoning 제목
  reasoningTitle: {
    fontWeight: "600",
    color: "#555555",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // 🧠 GPT reasoning 텍스트
  reasoningText: {
    color: "#666666",
    fontStyle: "italic",
    lineHeight: "1.5",
  },

  // 📝 시스템 메시지 (중앙 안내 등)
  systemMessage: {
    textAlign: "center",
    color: theme.NEUTRAL_LIGHT_TEXT,
    margin: "12px 0",
    fontSize: "12px",
    backgroundColor: "rgba(130, 124, 209, 0.05)",
    padding: "8px 16px",
    borderRadius: "12px",
    display: "inline-block",
    maxWidth: "85%",
    marginLeft: "auto",
    marginRight: "auto",
    border: "1px solid rgba(130, 124, 209, 0.1)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
  },

  // 👥 하단 참여자 영역 스타일
  participants: {
    marginTop: "1rem",
    fontSize: "12px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // ✅ 입력창 wrapper
  inputBoxContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "1rem",
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
    boxShadow: "0 -1px 5px rgba(0, 0, 0, 0.03)",
  },

  // ✅ 입력창 + 전송 버튼 한 줄 정렬
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  // 📝 입력 필드
  inputField: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: "24px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#FAFAFA",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05) inset",
    ":focus": {
      borderColor: theme.MAIN_COLOR,
      boxShadow: `0 0 0 3px ${theme.MAIN_LIGHT}`,
      backgroundColor: "#FFFFFF",
    },
  },

  // 🚀 전송 버튼
  sendButton: {
    padding: "12px 20px",
    borderRadius: "24px",
    backgroundColor: theme.MAIN_COLOR,
    color: "#FFFFFF",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(130, 124, 209, 0.2)",
    ":hover": {
      backgroundColor: theme.MAIN_DARK,
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(130, 124, 209, 0.3)",
    },
    ":active": {
      transform: "translateY(0)",
      boxShadow: "0 1px 2px rgba(130, 124, 209, 0.2)",
    },
    ":disabled": {
      backgroundColor: "rgba(130, 124, 209, 0.4)",
      cursor: "not-allowed",
      boxShadow: "none",
    },
  },

  // 🤖 GPT 질문 체크박스 라벨
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: theme.NEUTRAL_TEXT,
    userSelect: "none",
    fontWeight: "500",
    padding: "4px 0",
    cursor: "pointer",
    transition: "color 0.2s ease",
    ":hover": {
      color: theme.MAIN_COLOR,
    },
  },

  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: theme.MAIN_COLOR,
  },

  // 👤 아바타 스타일
  avatar: {
    width: "36px",
    height: "36px",
    minWidth: "36px", // 아바타 크기 유지를 위해 추가
    borderRadius: "50%",
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    border: `1px solid rgba(130, 124, 209, 0.2)`,
  },
  
  // 🤖 GPT 아바타
  gptAvatar: {
    width: "36px",
    height: "36px",
    minWidth: "36px", // 아바타 크기 유지를 위해 추가
    borderRadius: "50%",
    backgroundColor: "#F0F7FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E8F1FF",
  },
  
  // 🧩 GPT 및 귓속말 뱃지 스타일
  badgeBase: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  
  whisperBadge: {
    backgroundColor: "#FFF3D9",
    color: "#CC8800",
    border: "1px solid #FFE5B4",
  },
  
  gptBadge: {
    backgroundColor: "#E9F5FF",
    color: "#0073E6",
    border: "1px solid #CCE5FF",
  },
  
  // 모바일 아바타 스타일
  mobileAvatar: {
    width: "28px",
    height: "28px",
    minWidth: "28px", // 아바타 크기 유지를 위해 추가
    fontSize: "14px",
  },
  
  // 모바일 로딩 버튼
  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    color: theme.NEUTRAL_TEXT,
    padding: "8px 16px",
    borderRadius: theme.ROUNDED_MD,
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    margin: "0 auto 16px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.SHADOW_SM,
    transition: "all 0.2s ease",
    width: "auto",
  },
  
  // 로딩 컨테이너 (더 작은 화면에서도 잘 보이도록)
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "200px",
    padding: "20px",
  },
  
  loadingSpinner: {
    width: "36px",
    height: "36px",
    border: `3px solid ${theme.MAIN_LIGHT}`,
    borderRadius: "50%",
    borderTop: `3px solid ${theme.MAIN_COLOR}`,
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  
  // 메시지 영역 컨테이너
  messageListContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
};

export default styles;