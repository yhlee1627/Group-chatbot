const styles = {
  // 💬 전체 메시지 묶음 컨테이너 (좌우 정렬)
  messageContainer: {
    display: "flex",
    width: "100%",
    marginBottom: "1rem",
  },

  // 💬 말풍선 기본 스타일
  bubbleBase: {
    padding: "12px 16px",
    borderRadius: "16px",
    maxWidth: "600px",
    wordBreak: "break-word",
    lineHeight: "1.5",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  // 🧑‍🎓 내가 보낸 메시지 (오른쪽)
  bubbleMyMessage: {
    backgroundColor: "#DCF8C6",
    color: "#111",
  },

  // 🧑‍🎓 다른 학생이 보낸 메시지 (왼쪽)
  bubbleOther: {
    backgroundColor: "#F3F3F3",
    color: "#111",
  },

  // 🤖 GPT 전체 대상 메시지
  bubbleGptPublic: {
    backgroundColor: "#EAF3FF",
    color: "#003366",
  },

  // 🤖 GPT 귓속말 메시지
  bubbleGptWhisper: {
    backgroundColor: "#FFF4DC",
    border: "2px dashed #FFD700",
    color: "#443300",
  },

  // 🧑‍🏫 보낸 사람 이름 (말풍선 상단)
  senderLabel: {
    fontSize: "13px",
    fontWeight: "bold",
    marginBottom: "4px",
  },

  // 🕒 타임스탬프 (말풍선 하단)
  timestamp: {
    fontSize: "11px",
    color: "#999",
    marginTop: "6px",
  },

  // 🤫 GPT 귓속말 안내 라벨
  whisperLabel: {
    fontSize: "13px",
    color: "#cc8800",
    fontWeight: "bold",
    marginBottom: "4px",
  },

  // 📝 시스템 메시지 (중앙 안내 등)
  systemMessage: {
    textAlign: "center",
    color: "#666",
    margin: "8px 0",
    fontStyle: "italic",
    fontSize: "13px",
  },

  // 👥 하단 참여자 영역 스타일
  participants: {
    marginTop: "1rem",
    fontSize: "14px",
    color: "#555",
  },

  // ✅ 입력창 wrapper
  inputBoxContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "1rem",
    padding: "0.5rem 0",
  },

  // ✅ 입력창 + 전송 버튼 한 줄 정렬
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  // 📝 입력 필드
  inputField: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fff",
  },

  // 🚀 전송 버튼
  sendButton: {
    padding: "0.75rem 1.2rem",
    borderRadius: "8px",
    backgroundColor: "#007AFF",
    color: "#fff",
    border: "none",
    fontSize: "15px",
    cursor: "pointer",
  },

  // 🤖 GPT 질문 체크박스 라벨
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "14px",
    userSelect: "none",
  },

  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
};

export default styles;