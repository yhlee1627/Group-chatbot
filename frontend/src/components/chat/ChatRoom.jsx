import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";
import MessageList from "./MessageList";
import InputBox from "./InputBox";
import { motion } from "framer-motion";
import theme from "../../styles/theme";

// 메시지 데이터 정규화 헬퍼 함수 - 더 견고한 버전
const normalizeMessage = (msg, currentStudentId) => {
  // 기존 메시지 객체 복사
  const normalizedMsg = { ...msg };
  
  // GPT 메시지는 모두 표시하도록 특별 처리
  const isGPT = normalizedMsg.sender_id === "gpt";
  
  // 귓속말 관련 필드 정규화
  // 백엔드가 whisper_to 필드를 사용할 수도 있고, target+whisper 조합을 사용할 수도 있음
  if (normalizedMsg.whisper_to) {
    normalizedMsg.whisper = true;
    normalizedMsg.target = normalizedMsg.whisper_to;
  }
  
  // isWhisperToMe 속성 추가 (GPT 메시지는 항상 true로 설정하여 모두 표시)
  normalizedMsg.isWhisperToMe = isGPT || 
    (normalizedMsg.whisper === true && normalizedMsg.target === currentStudentId) ||
    (normalizedMsg.whisper_to === currentStudentId);
  
  // isFromMe 속성 추가
  normalizedMsg.isFromMe = normalizedMsg.sender_id === currentStudentId;
  
  // isPublic 속성 추가 (GPT 메시지는 항상 공개 메시지로 간주)
  normalizedMsg.isPublic = isGPT || 
    (!normalizedMsg.target && !normalizedMsg.whisper_to && !normalizedMsg.whisper);
  
  // 메시지가 항상 표시되도록 보장하는 플래그 (디버깅용)
  normalizedMsg.showForDebug = isGPT; 
  
  return normalizedMsg;
};

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isLeaveHovered, setIsLeaveHovered] = useState(false);
  const [hoveredChatItem, setHoveredChatItem] = useState(null);
  const [hoveredParticipant, setHoveredParticipant] = useState(null);
  const [isCheckboxLabelHovered, setIsCheckboxLabelHovered] = useState(false);
  const [isLoadMoreHovered, setIsLoadMoreHovered] = useState(false);

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const roomId = localStorage.getItem("roomId");

  const messagesEndRef = useRef(null);
  const messageAreaRef = useRef(null);

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

    // 메시지 정규화 전 후 상태 전체 로깅
    const logMessageStructure = (prefix, msg) => {
      console.log(`${prefix} 메시지 구조:`, {
        sender_id: msg.sender_id,
        target: msg.target,
        whisper_to: msg.whisper_to,
        whisper: msg.whisper,
        isPublic: msg.isPublic,
        isWhisperToMe: msg.isWhisperToMe,
        isFromMe: msg.isFromMe,
        myStudentId: studentId
      });
    };

    socket.on("receive_message", (msg) => {
      console.log("📩 원본 메시지 수신:", JSON.stringify(msg, null, 2));
      
      // 디버깅 - 필터링 전 모든 메시지 속성 확인
      logMessageStructure("필터링 전", msg);
      
      // GPT 메시지는 무조건 표시 (아주 중요: 귓속말 기능 디버깅 위해)
      const isGPT = msg.sender_id === "gpt";
      
      // 메시지 데이터 정규화
      const normalizedMsg = normalizeMessage(msg, studentId);
      
      // 정규화 후 메시지 상태 확인
      logMessageStructure("정규화 후", normalizedMsg);
      
      // GPT 메시지거나 일반적인 필터링 조건을 만족하는 메시지만 표시
      if (isGPT || normalizedMsg.isPublic || normalizedMsg.isWhisperToMe || normalizedMsg.isFromMe) {
        console.log("✅ 메시지 표시 결정:", normalizedMsg);
        // 메시지 추가
        setMessages((prev) => [...prev, normalizedMsg]);
        
        // 메시지에서 이름 정보 저장
        if (normalizedMsg.sender_id && normalizedMsg.name) {
          setUserNames(prev => ({ ...prev, [normalizedMsg.sender_id]: normalizedMsg.name }));
        }
      } else {
        console.log(`🚫 나(${studentId})에게 온 메시지가 아님, 무시함`);
      }
    });

    socket.on("message_history", (data) => {
      // 새로운 API 응답 형식 처리 (메시지 배열 + 페이지네이션 정보)
      const messages = data.messages || [];
      
      console.log("📚 메시지 히스토리 수신:", {
        count: messages.length
      });
      
      // 메시지 히스토리 정규화
      const normalizedMessages = messages.map(msg => normalizeMessage(msg, studentId));
      
      setMessages(normalizedMessages);
      setIsLoading(false);
      
      // 메시지 히스토리에서 학생 이름 정보 추출
      const names = {};
      normalizedMessages.forEach(msg => {
        if (msg.sender_id && msg.name) {
          names[msg.sender_id] = msg.name;
        }
      });
      setUserNames(prev => ({ ...prev, ...names }));
      
      // 자동 스크롤 다운 실행
      setTimeout(scrollToBottom, 100);
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
    console.log("토글 사이드바 호출됨", { 현재상태: showSidebar });
    setShowSidebar(prev => !prev);
  };

  // 스타일 계산 함수들
  const getCloseButtonStyle = () => {
    return {
      ...styles.closeButton,
      ...(isCloseHovered ? { backgroundColor: "rgba(0, 0, 0, 0.05)" } : {})
    };
  };

  const getMenuButtonStyle = () => {
    return {
      ...styles.menuButton,
      ...(isMenuHovered ? { backgroundColor: theme.MAIN_LIGHT } : {})
    };
  };

  const getLeaveButtonStyle = () => {
    return {
      ...styles.leaveButton,
      ...(isLeaveHovered ? { backgroundColor: theme.MAIN_LIGHT } : {})
    };
  };

  const getChatItemStyle = (itemId) => {
    return {
      ...styles.chatItem,
      ...(hoveredChatItem === itemId ? { backgroundColor: theme.MAIN_LIGHT } : {})
    };
  };

  const getParticipantItemStyle = (participantId) => {
    return {
      ...styles.participantItem,
      ...(hoveredParticipant === participantId ? { backgroundColor: theme.MAIN_LIGHT } : {})
    };
  };

  const getCheckboxLabelStyle = () => {
    return {
      ...styles.checkboxLabel,
      ...(isCheckboxLabelHovered ? { color: theme.MAIN_COLOR } : {})
    };
  };

  const getLoadMoreButtonStyle = () => {
    return {
      ...styles.loadMoreButton,
      ...(isLoadMoreHovered ? { 
        backgroundColor: theme.MAIN_LIGHT,
        borderColor: theme.MAIN_COLOR 
      } : {})
    };
  };

  const loadMoreMessages = () => {
    setLoadingMore(true);
    socket.emit("get_messages", { room_id: roomId, page: Math.ceil(messages.length / 20) + 1 });
  };

  return (
    <div style={{
      ...styles.container,
      ...(isMobile && { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' })
    }}>
      {/* 모바일 모드에서 사이드바가 열렸을 때 배경에 오버레이 추가 */}
      {isMobile && showSidebar && (
        <div 
          style={styles.overlay}
          onClick={toggleSidebar}
        />
      )}
    
      {/* 사이드바 컴포넌트 */}
      <div style={{
        ...styles.sidebar,
        ...(isMobile ? { 
          position: 'fixed',
          left: 0,
          top: 0,
          width: '80%',
          maxWidth: '320px',
          height: '100%',
          zIndex: 1001,
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease'
        } : {})
      }}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>채팅방</h2>
          {isMobile && (
            <button 
              onClick={toggleSidebar} 
              style={getCloseButtonStyle()}
              onMouseEnter={() => setIsCloseHovered(true)}
              onMouseLeave={() => setIsCloseHovered(false)}
            >
              ✕
            </button>
          )}
        </div>
        <div style={styles.chatList}>
          <div 
            style={getChatItemStyle('main')}
            onMouseEnter={() => setHoveredChatItem('main')}
            onMouseLeave={() => setHoveredChatItem(null)}
          >
            <div style={styles.chatItemContent}>
              <div style={styles.chatItemName}>{roomTitle}</div>
              <div style={styles.chatItemPreview}>
                {participants.length}명 참여 중
              </div>
            </div>
          </div>
          
          <div style={styles.participantsSection}>
            <h3 style={styles.participantsTitle}>
              <span>👥</span> 참여자 목록
            </h3>
            <div style={styles.participantsContainer}>
              {participants.map(p => (
                <div 
                  key={p.student_id} 
                  style={getParticipantItemStyle(p.student_id)}
                  onMouseEnter={() => setHoveredParticipant(p.student_id)}
                  onMouseLeave={() => setHoveredParticipant(null)}
                >
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

      {/* 메인 콘텐츠 영역 */}
      <div style={{
        ...styles.mainContent,
        ...(isMobile && { 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          width: '100%',
          position: 'relative'
        })
      }}>
        {/* 헤더 - 현재 채팅방 정보 */}
        <div style={{
          ...styles.header,
          ...(isMobile && { 
            padding: '8px 12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          })
        }}>
          <div style={styles.headerLeft}>
            {isMobile && (
              <button 
                onClick={toggleSidebar} 
                style={getMenuButtonStyle()}
                onMouseEnter={() => setIsMenuHovered(true)}
                onMouseLeave={() => setIsMenuHovered(false)}
              >
                ☰
              </button>
            )}
            <div style={styles.roomInfo}>
              <h2 style={styles.title}>{roomTitle}</h2>
              <div style={styles.participantCount}>
                {participants.length}명 참여 중
              </div>
              <div style={styles.participantList}>
                {participants.slice(0, 3).map(p => (
                  <span key={p.student_id} style={styles.participantName}>
                    {p.name || p.student_id}
                  </span>
                )).reduce((prev, curr, i) => i === 0 ? [curr] : [prev, ', ', curr], [])}
                {participants.length > 3 && ` 외 ${participants.length - 3}명`}
              </div>
            </div>
          </div>
          <button 
            onClick={leaveRoom} 
            style={getLeaveButtonStyle()}
            onMouseEnter={() => setIsLeaveHovered(true)}
            onMouseLeave={() => setIsLeaveHovered(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7Z" fill="currentColor"/>
              <path d="M4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
            </svg>
            <span style={styles.leaveButtonText}>나가기</span>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div 
          ref={messageAreaRef}
          style={{
            ...styles.messageArea,
            ...(isMobile && { 
              flex: 1,
              paddingBottom: '70px', // 모바일에서 입력창 높이만큼 여유 공간 추가
              overflowY: 'auto'
            })
          }}
        >
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner} />
              <p style={styles.loadingText}>메시지 불러오는 중...</p>
            </div>
          ) : (
            <div style={styles.messageListContainer}>
              {messages.length > 20 && (
                <button 
                  style={getLoadMoreButtonStyle()}
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  onMouseEnter={() => setIsLoadMoreHovered(true)}
                  onMouseLeave={() => setIsLoadMoreHovered(false)}
                >
                  {loadingMore ? "로딩 중..." : "이전 메시지 더 보기"}
                </button>
              )}
              <MessageList 
                messages={messages} 
                studentId={studentId} 
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력 컨테이너 */}
        <div style={{
          ...styles.inputContainer,
          ...(isMobile && { 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            padding: '8px 0',
            backgroundColor: '#fff',
            borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
            zIndex: 10
          })
        }}>
          <div style={styles.gptCheckbox}>
            <input
              type="checkbox"
              id="gpt-checkbox"
              checked={isGPT}
              onChange={(e) => setIsGPT(e.target.checked)}
              style={styles.checkbox}
            />
            <label
              htmlFor="gpt-checkbox"
              style={getCheckboxLabelStyle()}
              onMouseEnter={() => setIsCheckboxLabelHovered(true)}
              onMouseLeave={() => setIsCheckboxLabelHovered(false)}
            >
              GPT에게 질문하기
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
    backgroundColor: theme.NEUTRAL_BACKGROUND,
    fontFamily: "'Noto Sans KR', sans-serif",
    overflow: "hidden", // 화면 넘침 방지
  },
  sidebar: {
    width: "300px",
    backgroundColor: "#FFFFFF",
    borderRight: `1px solid ${theme.NEUTRAL_BORDER}`,
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
  },
  sidebarHeader: {
    padding: "20px",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0",
    color: theme.MAIN_COLOR,
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: theme.NEUTRAL_BACKGROUND,
    transition: "background-color 0.2s ease",
    cursor: "pointer",
  },
  chatItemAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    fontSize: "24px",
    color: theme.MAIN_COLOR,
    border: `1px solid rgba(130, 124, 209, 0.2)`,
    boxShadow: theme.SHADOW_SM,
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemName: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    marginBottom: "6px",
  },
  chatItemPreview: {
    fontSize: "13px",
    color: theme.NEUTRAL_LIGHT_TEXT,
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
    padding: "16px 20px",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: "#FFFFFF",
    boxShadow: theme.SHADOW_SM,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    marginRight: "16px",
    color: theme.MAIN_COLOR,
    padding: "8px",
    borderRadius: "50%",
    transition: "background-color 0.2s ease",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    fontSize: "20px",
    color: theme.MAIN_COLOR,
    border: `1px solid rgba(130, 124, 209, 0.2)`,
    boxShadow: theme.SHADOW_SM,
  },
  roomInfo: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0",
    color: theme.NEUTRAL_TEXT,
  },
  participantCount: {
    fontSize: "13px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    marginTop: "4px",
  },
  participantList: {
    fontSize: "12px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    marginTop: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  participantName: {
    fontSize: "12px",
    color: theme.NEUTRAL_LIGHT_TEXT,
  },
  leaveButton: {
    backgroundColor: "transparent",
    border: `1px solid ${theme.MAIN_COLOR}`,
    color: theme.MAIN_COLOR,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 16px",
    borderRadius: theme.ROUNDED_MD,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveButtonText: {
    marginLeft: "4px",
  },
  messageArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: theme.NEUTRAL_BACKGROUND,
    position: "relative",
  },
  inputContainer: {
    padding: "16px 20px",
    borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 -1px 5px rgba(0, 0, 0, 0.03)",
  },
  gptCheckbox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginRight: "8px",
    accentColor: theme.MAIN_COLOR,
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "14px",
    color: theme.NEUTRAL_TEXT,
    userSelect: "none",
    fontWeight: "500",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    padding: "8px",
    color: theme.NEUTRAL_TEXT,
    borderRadius: "50%",
    transition: "background-color 0.2s ease",
  },
  // 반응형 스타일 수정
  '@media (max-width: 768px)': {
    sidebar: {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '80%',
      maxWidth: '320px',
      zIndex: 1001,
      transform: 'translateX(-100%)',
      transition: 'transform 0.3s ease',
    },
    sidebarOpen: {
      transform: 'translateX(0)',
    },
    mainContent: {
      width: '100%',
    },
    messageArea: {
      padding: '12px',
    },
    inputContainer: {
      padding: '8px 12px',
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
    backdropFilter: "blur(2px)",
  },
  participantsSection: {
    padding: "20px",
    borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
  },
  participantsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    color: theme.NEUTRAL_TEXT,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  participantsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  participantItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: theme.NEUTRAL_BACKGROUND,
    borderRadius: theme.ROUNDED_MD,
    transition: "background-color 0.2s ease",
  },
  participantAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    fontSize: "16px",
    color: theme.MAIN_COLOR,
    border: `1px solid rgba(130, 124, 209, 0.2)`,
  },
  participantInfo: {
    display: "flex",
    flexDirection: "column",
  },
  participantDisplayName: {
    fontSize: "14px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
  },
  participantId: {
    fontSize: "12px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    marginTop: "2px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "40px",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: `3px solid ${theme.MAIN_LIGHT}`,
    borderRadius: "50%",
    borderTop: `3px solid ${theme.MAIN_COLOR}`,
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loadingText: {
    fontSize: "15px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    margin: 0,
    fontWeight: "500",
  },
  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    color: theme.NEUTRAL_TEXT,
    padding: "10px 16px",
    borderRadius: theme.ROUNDED_MD,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    margin: "0 auto 20px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: theme.SHADOW_SM,
    transition: "all 0.2s ease",
  },
  messageListContainer: {
    display: "flex",
    flexDirection: "column",
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