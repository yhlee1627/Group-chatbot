const styles = {
  // 💬 메시지 리스트 컨테이너
  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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

  // 💬 말풍선 기본 스타일
  bubbleBase: {
    padding: "12px 16px",
    borderRadius: "22px",
    maxWidth: "70%",
    wordBreak: "break-word",
    lineHeight: "1.4",
    fontSize: "14px",
    boxShadow: "none",
  },

  // 🧑‍🎓 내가 보낸 메시지 (오른쪽)
  bubbleMyMessage: {
    backgroundColor: "#FFFFFF",
    color: "#262626",
    border: "1px solid #EFEFEF",
    borderBottomRightRadius: "4px",
  },

  // 🧑‍🎓 다른 학생이 보낸 메시지 (왼쪽)
  bubbleOther: {
    backgroundColor: "#EFEFEF",
    color: "#262626",
    borderBottomLeftRadius: "4px",
  },

  // 🤖 GPT 전체 대상 메시지
  bubbleGptPublic: {
    backgroundColor: "#F2F7FF",
    color: "#262626",
    borderBottomLeftRadius: "4px",
    border: "1px solid #E8F1FF",
  },

  // 🤖 GPT 귓속말 메시지
  bubbleGptWhisper: {
    backgroundColor: "#FFF8E8",
    border: "1px solid #FFE5B4",
    color: "#262626",
    borderBottomLeftRadius: "4px",
  },

  // 🧑‍🏫 보낸 사람 이름 (말풍선 상단)
  senderLabel: {
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "4px",
    color: "#262626",
  },

  // 🕒 타임스탬프 (말풍선 하단)
  timestamp: {
    fontSize: "10px",
    color: "#8E8E8E",
    marginTop: "4px",
  },

  // 🤫 GPT 귓속말 안내 라벨
  whisperLabel: {
    fontSize: "12px",
    color: "#cc8800",
    fontWeight: "600",
    marginBottom: "4px",
  },

  // 🧠 GPT reasoning 컨테이너
  reasoningContainer: {
    marginTop: "8px",
    padding: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: "8px",
    fontSize: "12px",
  },

  // 🧠 GPT reasoning 제목
  reasoningTitle: {
    fontWeight: "600",
    color: "#555555",
    marginBottom: "4px",
  },

  // 🧠 GPT reasoning 텍스트
  reasoningText: {
    color: "#666666",
    fontStyle: "italic",
  },

  // 📝 시스템 메시지 (중앙 안내 등)
  systemMessage: {
    textAlign: "center",
    color: "#8E8E8E",
    margin: "8px 0",
    fontSize: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    padding: "8px 16px",
    borderRadius: "12px",
    display: "inline-block",
    maxWidth: "80%",
    marginLeft: "auto",
    marginRight: "auto",
  },

  // 👥 하단 참여자 영역 스타일
  participants: {
    marginTop: "1rem",
    fontSize: "12px",
    color: "#8E8E8E",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  // ✅ 입력창 wrapper
  inputBoxContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "1rem",
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #DBDBDB",
  },

  // ✅ 입력창 + 전송 버튼 한 줄 정렬
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // 📝 입력 필드
  inputField: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "22px",
    border: "1px solid #DBDBDB",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#FAFAFA",
    transition: "border-color 0.2s",
    ":focus": {
      borderColor: "#0095F6",
    },
  },

  // 🚀 전송 버튼
  sendButton: {
    padding: "8px 16px",
    borderRadius: "22px",
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":disabled": {
      backgroundColor: "#B2DFFC",
      cursor: "not-allowed",
    },
  },

  // 🤖 GPT 질문 체크박스 라벨
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#262626",
    userSelect: "none",
  },

  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "#0095F6",
  },

  // 👤 아바타 스타일
  avatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },
};

export default styles;