import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";
import MessageList from "./MessageList";
import InputBox from "./InputBox";
import { motion } from "framer-motion";

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput] = useState("");
  const [roomTitle, setRoomTitle] = useState("채팅방");
  const [isGPT, setIsGPT] = useState(false);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [userNames, setUserNames] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const roomId = localStorage.getItem("roomId");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 화면 크기 변경에 따른 사이드바 표시 여부 설정
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setShowSidebar(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!studentId || !roomId) {
      alert("로그인 정보가 없습니다.");
      navigate("/student-login");
      return;
    }

    setIsLoading(true);

    socket.connect();
    socket.emit("join_room", { room_id: roomId, sender_id: studentId });
    socket.emit("get_messages", { room_id: roomId });

    socket.on("message_history", (history) => {
      setMessages(history);
      setIsLoading(false);
      
      // 메시지 히스토리에서 학생 이름 정보 추출
      const names = {};
      history.forEach(msg => {
        if (msg.sender_id && msg.name) {
          names[msg.sender_id] = msg.name;
        }
      });
      setUserNames(prev => ({ ...prev, ...names }));
    });

    socket.on("receive_message", (msg) => {
      if (msg.target && msg.target !== studentId) return;
      setMessages((prev) => [...prev, msg]);
      
      // 메시지에서 이름 정보 저장
      if (msg.sender_id && msg.name) {
        setUserNames(prev => ({ ...prev, [msg.sender_id]: msg.name }));
      }
    });

    socket.on("current_users", ({ participants }) => {
      setParticipants(participants);
      
      // 참여자 목록에서 이름 정보 추출
      const names = {};
      participants.forEach(p => {
        if (p.student_id && p.name) {
          names[p.student_id] = p.name;
        }
      });
      setUserNames(prev => ({ ...prev, ...names }));
    });

    socket.on("user_joined", ({ sender_id, name }) => {
      setParticipants((prev) =>
        prev.some(p => p.student_id === sender_id) 
          ? prev 
          : [...prev, { student_id: sender_id, name }]
      );
      
      // 참여자 이름 저장
      if (sender_id && name) {
        setUserNames(prev => ({ ...prev, [sender_id]: name }));
      }
      
      if (sender_id !== studentId) {
        const displayName = name || userNames[sender_id] || sender_id;
        setMessages((prev) => [
          ...prev,
          { 
            type: "system", 
            message: `${displayName}님이 참여했습니다`,
            timestamp: new Date().toISOString()
          },
        ]);
      }
    });

    socket.on("user_left", ({ sender_id, name }) => {
      setParticipants((prev) => prev.filter((user) => user.student_id !== sender_id));
      
      // 퇴장 메시지에 저장된 이름 사용
      const displayName = name || userNames[sender_id] || sender_id;
      setMessages((prev) => [
        ...prev,
        { 
          type: "system", 
          message: `${displayName}님이 나갔습니다`,
          timestamp: new Date().toISOString()
        },
      ]);
    });

    fetch(`${import.meta.env.VITE_BACKEND_URL}/rooms?room_id=eq.${roomId}`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setRoomTitle(data?.[0]?.title || "채팅방");
      });

    return () => {
      socket.disconnect();
      socket.off("message_history");
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("current_users");
    };
  }, []);

  const sendMessage = (text) => {
    socket.emit("send_message", {
      room_id: roomId,
      sender_id: studentId,
      message: text,
      is_gpt_question: isGPT,
      ...(isGPT ? { target: "gpt" } : {})
    });
  };

  const leaveRoom = () => {
    navigate("/student");
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div style={styles.container}>
      {/* 모바일 모드에서 사이드바가 열렸을 때 배경에 오버레이 추가 */}
      {isMobile && showSidebar && (
        <div 
          style={styles.overlay}
          onClick={toggleSidebar}
        />
      )}
    
      {/* 사이드바 - 모바일에서는 숨김 */}
      {showSidebar && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>채팅</h2>
            {isMobile && (
              <button onClick={toggleSidebar} style={styles.closeButton}>
                ✕
              </button>
            )}
          </div>
          <div style={styles.chatList}>
            <div style={styles.chatItem}>
              <div style={styles.chatItemAvatar}>👤</div>
              <div style={styles.chatItemContent}>
                <div style={styles.chatItemName}>{roomTitle}</div>
                <div style={styles.chatItemPreview}>
                  {participants.length}명 참여 중
                </div>
              </div>
            </div>
            
            <div style={styles.participantsSection}>
              <h3 style={styles.participantsTitle}>참여자 목록</h3>
              <div style={styles.participantsContainer}>
                {participants.map(p => (
                  <div key={p.student_id} style={styles.participantItem}>
                    <div style={styles.participantAvatar}>👤</div>
                    <div style={styles.participantInfo}>
                      <div style={styles.participantDisplayName}>{p.name || p.student_id}</div>
                      {p.name && <div style={styles.participantId}>{p.student_id}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div style={styles.mainContent}>
        {/* 헤더 - 현재 채팅방 정보만 표시 */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {!showSidebar && (
              <button onClick={toggleSidebar} style={styles.menuButton}>
                ☰
              </button>
            )}
            <div style={styles.avatar}>👤</div>
            <div style={styles.roomInfo}>
              <h2 style={styles.title}>{roomTitle}</h2>
              <div style={styles.participantCount}>
                {participants.length}명 참여 중
              </div>
              <div style={styles.participantList}>
                {participants.map(p => (
                  <span key={p.student_id} style={styles.participantName}>
                    {p.name || p.student_id}
                  </span>
                )).reduce((prev, curr) => prev.length ? [prev, ', ', curr] : [curr], [])}
              </div>
            </div>
          </div>
          <button onClick={leaveRoom} style={styles.leaveButton}>
            <span style={styles.leaveButtonText}>나가기</span>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div style={styles.messageArea}>
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>채팅 내용을 불러오는 중...</p>
            </div>
          ) : (
            <MessageList messages={messages} studentId={studentId} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div style={styles.inputContainer}>
          <div style={styles.gptCheckbox}>
            <input
              type="checkbox"
              id="gpt-question"
              checked={isGPT}
              onChange={(e) => setIsGPT(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="gpt-question" style={styles.checkboxLabel}>
              GPT에게 질문
            </label>
          </div>
          <InputBox
            input={input}
            setInput={setInput}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#FAFAFA",
    fontFamily: "'Noto Sans KR', sans-serif",
    overflow: "hidden", // 화면 넘침 방지
  },
  sidebar: {
    width: "300px",
    minWidth: "300px",
    borderRight: "1px solid #DBDBDB",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflowY: "auto",
    position: "relative",
    zIndex: 1001, // 오버레이보다 높은 z-index
  },
  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid #DBDBDB",
  },
  sidebarTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0",
    color: "#262626",
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #DBDBDB",
    backgroundColor: "#FAFAFA",
  },
  chatItemAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    fontSize: "20px",
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "4px",
  },
  chatItemPreview: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    minWidth: 0, // flexbox 내에서 줄어들 수 있도록 설정
    height: "100vh",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid #DBDBDB",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    marginRight: "12px",
    color: "#262626",
    padding: "0",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    fontSize: "16px",
  },
  roomInfo: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
    color: "#262626",
  },
  participantCount: {
    fontSize: "12px",
    color: "#8E8E8E",
    marginTop: "2px",
  },
  participantList: {
    fontSize: "12px",
    color: "#8E8E8E",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  participantName: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  leaveButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#0095F6",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 16px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
  },
  messageArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: "#FAFAFA",
  },
  inputContainer: {
    padding: "20px",
    borderTop: "1px solid #DBDBDB",
    backgroundColor: "#FFFFFF",
  },
  gptCheckbox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    marginRight: "8px",
    accentColor: "#0095F6",
  },
  checkboxLabel: {
    fontSize: "13px",
    color: "#262626",
    userSelect: "none",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0",
    color: "#262626",
  },
  // 반응형 스타일 수정
  '@media (max-width: 768px)': {
    sidebar: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '80%',
      maxWidth: '300px',
      zIndex: 1001,
    },
    mainContent: {
      width: '100%',
    }
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  participantsSection: {
    padding: "20px",
    borderTop: "1px solid #DBDBDB",
  },
  participantsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#262626",
  },
  participantsContainer: {
    display: "flex",
    flexDirection: "column",
  },
  participantItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #F0F0F0",
  },
  participantAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "8px",
    fontSize: "16px",
  },
  participantInfo: {
    display: "flex",
    flexDirection: "column",
  },
  participantDisplayName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
  },
  participantId: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "20px",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(0, 149, 246, 0.1)",
    borderRadius: "50%",
    borderTop: "4px solid #0095F6",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#8E8E8E",
    margin: 0,
  },
};

// CSS 애니메이션을 위한 스타일 태그 추가
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleTag);

export default ChatRoom;