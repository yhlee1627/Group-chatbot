import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import theme from "../styles/theme";

function StudentDashboard() {
  const [rooms, setRooms] = useState([]);
  const [topics, setTopics] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword1, setEditPassword1] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [activeTab, setActiveTab] = useState("name");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const classId = localStorage.getItem("classId");

  // 반응형 UI를 위한 창 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!studentId || !classId) {
      navigate("/student-login");
      return;
    }

    const fetchData = async () => {
      try {
        const roomRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/rooms`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        const topicRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/topics`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!roomRes.ok || !topicRes.ok) {
          throw new Error("Supabase fetch failed");
        }

        const roomData = await roomRes.json();
        const topicData = await topicRes.json();

        const topicMap = {};
        topicData.forEach((t) => {
          topicMap[t.topic_id] = {
            title: t.title,
            class_id: t.class_id,
          };
        });

        const filteredRooms = roomData.filter((room) => {
          const topic = topicMap[room.topic_id];
          return topic?.class_id === classId;
        });

        setTopics(topicMap);
        setRooms(filteredRooms);
      } catch (err) {
        console.error("❌ 채팅방 데이터를 불러오지 못했습니다:", err);
        setRooms([]);
      }
    };

    fetchData();
  }, []);

  const updateStudentInfo = async (name, password) => {
    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = password;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/students?student_id=eq.${encodeURIComponent(studentId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    const result = await res.json();
    console.log("📡 Supabase 응답 상태:", res.status, result);

    if (res.ok) {
      alert("정보가 수정되었습니다!");
      setShowSidebar(false);
    } else {
      alert("수정 실패 😢");
    }
  };

  const openProfileModal = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/students?student_id=eq.${encodeURIComponent(studentId)}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      const name = data?.[0]?.name || studentId;
      setCurrentName(name);
      setEditName(name);
      setEditPassword1("");
      setEditPassword2("");
      setActiveTab("name");
      setShowSidebar(true); // ✅ 사이드바 열기
    } catch (err) {
      console.error("❌ 학생 정보 불러오기 실패:", err);
      alert("내 정보 불러오기에 실패했습니다.");
    }
  };

  const handleNameSave = () => {
    if (!editName) {
      alert("이름을 입력해주세요.");
      return;
    }
    updateStudentInfo(editName, null);
  };

  const handlePasswordSave = () => {
    if (!editPassword1 || !editPassword2) {
      alert("비밀번호를 모두 입력해주세요.");
      return;
    }
    if (editPassword1 !== editPassword2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    updateStudentInfo(null, editPassword1);
  };

  const handleEnterRoom = (roomId) => {
    localStorage.setItem("roomId", roomId);
    navigate("/chat");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/student-login");
  };

  // 조 번호를 추출하는 함수
  const getGroupNumber = (room) => {
    // 방 제목에서 조 번호 추출
    const titleMatch = room.title && (
      // "3조 토론방" -> 3 형식 검사
      room.title.match(/^(\d+)조/) || 
      // "캡스톤 디자인 프로젝트 - 조 3" -> 3 형식 검사
      room.title.match(/조\s*(\d+)/)
    );
    
    if (titleMatch) {
      return parseInt(titleMatch[1], 10);
    }
    
    // room_id에서 조 번호 추출 (예: "r3-1" -> 3)
    const idMatch = room.room_id && room.room_id.match(/^r(\d+)-/);
    if (idMatch) {
      return parseInt(idMatch[1], 10);
    }
    
    return 999; // 조 번호가 없는 경우 맨 뒤로 정렬
  };

  const grouped = {};
  rooms.forEach((room) => {
    const tid = room.topic_id;
    if (!grouped[tid]) grouped[tid] = [];
    grouped[tid].push(room);
  });

  // 각 토픽 내에서 조 번호 순서로 정렬
  Object.keys(grouped).forEach(tid => {
    grouped[tid].sort((a, b) => {
      const aGroup = getGroupNumber(a);
      const bGroup = getGroupNumber(b);
      return aGroup - bGroup;
    });
  });

  return (
    <div style={{
      ...styles.container,
      ...(isMobile && styles.mobileContainer)
    }}>
      <header 
        style={{ 
          ...styles.header, 
          ...(isMobile ? styles.mobileHeader : {}) 
        }}
      >
        <div style={styles.logoContainer}>
          <img 
            src="/images/berry-icon.png" 
            alt="Berry Chat" 
            style={styles.logo}
            onError={(e) => {
              e.target.onerror = null;
              e.target.innerHTML = '🫐';
            }}
          />
          <h1 style={styles.title}>Berry Chat</h1>
        </div>
        <div style={styles.buttonGroup}>
          <button
            onClick={openProfileModal}
            style={styles.iconButton}
            title="설정"
            onMouseOver={(e) => {
              e.currentTarget.style.color = theme.MAIN_COLOR;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.NEUTRAL_TEXT;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 13.75C12.0711 13.75 13.75 12.0711 13.75 10C13.75 7.92893 12.0711 6.25 10 6.25C7.92893 6.25 6.25 7.92893 6.25 10C6.25 12.0711 7.92893 13.75 10 13.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.14874 4.10377L8.49997 2.5H11.5L11.8512 4.10377C12.0629 4.75228 12.5798 5.24326 13.1771 5.43907C13.7745 5.63489 14.4242 5.51634 14.9167 5.125L16.25 4.16667L18.0833 7.5L16.9083 8.33333C16.3982 8.68041 16.0911 9.27605 16.0911 9.9096C16.0911 10.5431 16.3982 11.1388 16.9083 11.4858L18.0833 12.5L16.25 15.8333L14.9167 14.875C14.4242 14.4837 13.7745 14.3651 13.1771 14.5609C12.5798 14.7567 12.0629 15.2477 11.8512 15.8962L11.5 17.5H8.49997L8.14874 15.8962C7.93711 15.2477 7.42022 14.7567 6.82287 14.5609C6.22552 14.3651 5.57575 14.4837 5.08331 14.875L3.74997 15.8333L1.91664 12.5L3.09164 11.4858C3.60172 11.1388 3.90884 10.5431 3.90884 9.9096C3.90884 9.27605 3.60172 8.68041 3.09164 8.33333L1.91664 7.5L3.74997 4.16667L5.08331 5.125C5.57575 5.51634 6.22552 5.63489 6.82287 5.43907C7.42022 5.24326 7.93711 4.75228 8.14874 4.10377Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseOver={(e) => {
              e.currentTarget.style.color = theme.MAIN_COLOR;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = theme.NEUTRAL_TEXT;
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div style={{
        ...styles.content,
        ...(isMobile && styles.mobileContent)
      }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <div style={styles.emptyText}>참여 가능한 채팅방이 없습니다.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([topicId, roomList]) => (
            <div key={topicId} style={{
              ...styles.topicContainer,
              ...(isMobile && styles.mobileTopicContainer)
            }}>
              <h3 style={{
                ...styles.topicTitle,
                ...(isMobile && styles.mobileTopicTitle)
              }}>
                {topics[topicId]?.title || "제목 없음"}
              </h3>
              <div style={{
                ...styles.roomList,
                ...(isMobile && styles.mobileRoomList)
              }}>
                {roomList.map((room) => (
                  <div key={room.room_id} 
                    style={{
                      ...styles.roomCard,
                      ...(isMobile && styles.mobileRoomCard)
                    }}
                    onClick={() => handleEnterRoom(room.room_id)}>
                    <div style={styles.roomInfo}>
                      <div style={{
                        ...styles.roomAvatar,
                        ...(isMobile && styles.mobileRoomAvatar)
                      }}>👥</div>
                      <div style={styles.roomDetails}>
                        <span style={{
                          ...styles.roomTitle,
                          ...(isMobile && styles.mobileRoomTitle)
                        }}>{room.title}</span>
                        <span style={{
                          ...styles.roomSubtitle,
                          ...(isMobile && { fontSize: '12px' })
                        }}>채팅방 참여하기</span>
                      </div>
                    </div>
                    <button style={styles.joinButton}>
                      <svg width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5L15 12L8 19" stroke={theme.MAIN_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 프로필 사이드바 */}
      {showSidebar && (
        <>
          <div style={styles.overlay} onClick={() => setShowSidebar(false)} />
          <div style={{
            ...styles.sidebar,
            ...(isMobile && styles.mobileSidebar)
          }}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>내 프로필</h3>
              <button onClick={() => setShowSidebar(false)} style={styles.closeButton}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12" stroke={theme.NEUTRAL_TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 4L12 12" stroke={theme.NEUTRAL_TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div style={styles.profileSection}>
              <div style={styles.profileAvatar}>👤</div>
              <div style={styles.profileName}>{currentName}</div>
              <div style={styles.profileId}>{studentId}</div>
            </div>

            <div style={styles.tabContainer}>
              <button 
                onClick={() => setActiveTab("name")} 
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "name" ? styles.activeTab : {})
                }}>
                이름 변경
              </button>
              <button 
                onClick={() => setActiveTab("password")} 
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "password" ? styles.activeTab : {})
                }}>
                비밀번호 변경
              </button>
            </div>

            {activeTab === "name" && (
              <div style={styles.formSection}>
                <label style={styles.inputLabel}>이름</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={styles.input}
                  placeholder="변경할 이름을 입력하세요"
                />
                <button onClick={handleNameSave} style={styles.saveButton}>
                  저장
                </button>
              </div>
            )}

            {activeTab === "password" && (
              <div style={styles.formSection}>
                <label style={styles.inputLabel}>새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={editPassword1}
                  onChange={(e) => setEditPassword1(e.target.value)}
                  style={styles.input}
                />
                <label style={styles.inputLabel}>비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={editPassword2}
                  onChange={(e) => setEditPassword2(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handlePasswordSave} style={styles.saveButton}>
                  저장
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// 블루베리 테마 스타일 정의
const styles = {
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '20px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.MAIN_LIGHT,
  },
  mobileContainer: {
    padding: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderRadius: theme.ROUNDED_LG,
    boxShadow: theme.SHADOW_SM,
    marginBottom: '20px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
  },
  mobileHeader: {
    padding: '10px',
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: "0",
    color: theme.MAIN_COLOR,
    display: "flex",
    alignItems: "center",
  },
  // 모바일 타이틀
  mobileTitle: {
    fontSize: "20px",
  },
  headerLogo: {
    width: "28px",
    height: "28px",
    marginRight: "10px",
    verticalAlign: "middle",
  },
  // 모바일 헤더 로고
  mobileHeaderLogo: {
    width: "24px",
    height: "24px",
    marginRight: "8px",
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  iconButton: {
    backgroundColor: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: theme.NEUTRAL_TEXT,
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  logoutButton: {
    backgroundColor: "transparent",
    color: theme.NEUTRAL_TEXT,
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_MD,
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  // 모바일 콘텐츠
  mobileContent: {
    gap: "20px",
  },
  topicContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    boxShadow: theme.SHADOW_MD,
    overflow: "hidden",
  },
  // 모바일 토픽 컨테이너
  mobileTopicContainer: {
    borderRadius: theme.ROUNDED_MD,
  },
  topicTitle: {
    margin: "0",
    padding: "16px 20px",
    fontSize: "18px",
    fontWeight: "600",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    color: theme.NEUTRAL_TEXT,
  },
  // 모바일 토픽 제목
  mobileTopicTitle: {
    fontSize: "16px",
    padding: "12px 16px",
  },
  roomList: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  // 모바일 룸 리스트 
  mobileRoomList: {
    padding: "12px",
    gap: "8px",
  },
  roomCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    backgroundColor: "#F9F9FB",
    borderRadius: theme.ROUNDED_MD,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.MAIN_LIGHT,
    },
  },
  // 모바일 룸 카드
  mobileRoomCard: {
    padding: "12px",
  },
  roomAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    fontSize: "20px",
    color: theme.MAIN_COLOR,
    border: `1px solid rgba(130, 124, 209, 0.2)`,
    flexShrink: 0,
  },
  // 모바일 룸 아바타
  mobileRoomAvatar: {
    width: "36px",
    height: "36px",
    fontSize: "18px",
    marginRight: "12px",
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
  },
  roomDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  roomTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
  },
  // 모바일 룸 제목
  mobileRoomTitle: {
    fontSize: "14px",
  },
  roomSubtitle: {
    fontSize: "13px",
    color: theme.NEUTRAL_LIGHT_TEXT,
  },
  joinButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    border: `1px solid ${theme.MAIN_COLOR}`,
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  sidebar: {
    position: "fixed",
    top: "0",
    right: "0",
    width: "360px",
    height: "100%",
    backgroundColor: "#FFFFFF",
    boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.08)",
    zIndex: "1001",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease",
  },
  // 모바일 사이드바
  mobileSidebar: {
    width: "85%",
    maxWidth: "320px",
  },
  overlay: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: "1000",
    transition: "opacity 0.3s ease",
    backdropFilter: "blur(2px)",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: `1px solid rgba(130, 124, 209, 0.2)`,
    backgroundColor: "rgba(130, 124, 209, 0.05)",
  },
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: theme.MAIN_COLOR,
  },
  closeButton: {
    backgroundColor: "transparent",
    color: theme.NEUTRAL_TEXT,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: theme.ROUNDED_FULL,
    cursor: "pointer",
    transition: "all 0.2s ease",
    padding: 0,
  },
  profileSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    borderBottom: `1px solid rgba(130, 124, 209, 0.2)`,
  },
  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: theme.ROUNDED_FULL,
    backgroundColor: theme.MAIN_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    marginBottom: "16px",
  },
  profileName: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
    color: theme.NEUTRAL_TEXT,
  },
  profileId: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
  },
  tabContainer: {
    display: "flex",
    borderBottom: `1px solid rgba(130, 124, 209, 0.2)`,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    padding: "14px 0",
    fontSize: "14px",
    cursor: "pointer",
    color: theme.NEUTRAL_LIGHT_TEXT,
    transition: "all 0.2s ease",
  },
  activeTab: {
    color: theme.MAIN_COLOR,
    fontWeight: "600",
    borderBottom: `2px solid ${theme.MAIN_COLOR}`,
  },
  formSection: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
    color: theme.NEUTRAL_TEXT,
  },
  input: {
    padding: "12px",
    borderRadius: theme.ROUNDED_MD,
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    fontSize: "14px",
    backgroundColor: "#FAFAFA",
    outline: "none",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: theme.MAIN_COLOR,
    }
  },
  saveButton: {
    backgroundColor: theme.MAIN_COLOR,
    color: "white",
    border: "none",
    borderRadius: theme.ROUNDED_MD,
    padding: "12px 0",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: theme.MAIN_HOVER,
    }
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 24px",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    border: `1px solid rgba(130, 124, 209, 0.2)`,
    boxShadow: theme.SHADOW_SM,
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "15px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    textAlign: "center",
  },
};

export default StudentDashboard;