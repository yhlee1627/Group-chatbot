import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [rooms, setRooms] = useState([]);
  const [topics, setTopics] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword1, setEditPassword1] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [activeTab, setActiveTab] = useState("name");

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const classId = localStorage.getItem("classId");

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

  const openSidebar = async () => {
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>채팅방</h2>
        <div style={styles.buttonGroup}>
          <button onClick={openSidebar} style={styles.profileButton}>
            <span style={styles.profileIcon}>👤</span>
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {Object.keys(grouped).length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <div style={styles.emptyText}>참여 가능한 채팅방이 없습니다.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([topicId, roomList]) => (
            <div key={topicId} style={styles.topicContainer}>
              <h3 style={styles.topicTitle}>
                {topics[topicId]?.title || "제목 없음"}
              </h3>
              <div style={styles.roomList}>
                {roomList.map((room) => (
                  <div key={room.room_id} style={styles.roomCard}
                    onClick={() => handleEnterRoom(room.room_id)}>
                    <div style={styles.roomInfo}>
                      <div style={styles.roomAvatar}>👥</div>
                      <div style={styles.roomDetails}>
                        <span style={styles.roomTitle}>{room.title}</span>
                        <span style={styles.roomSubtitle}>채팅방 참여하기</span>
                      </div>
                    </div>
                    <button style={styles.joinButton}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5L15 12L8 19" stroke="#0095F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>내 프로필</h3>
              <button onClick={() => setShowSidebar(false)} style={styles.closeButton}>
                ✕
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

            <button onClick={handleLogout} style={styles.logoutButton}>
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 인스타그램 스타일 정의
const styles = {
  container: {
    maxWidth: "935px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#262626",
    backgroundColor: "#FAFAFA",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #DBDBDB",
    marginBottom: "24px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0",
  },
  buttonGroup: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  profileButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    fontSize: "20px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  topicContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    border: "1px solid #DBDBDB",
    overflow: "hidden",
  },
  topicTitle: {
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px",
    margin: "0",
    borderBottom: "1px solid #EFEFEF",
  },
  roomList: {
    display: "flex",
    flexDirection: "column",
  },
  roomCard: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #EFEFEF",
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: "#FFFFFF",
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  roomAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  roomDetails: {
    display: "flex",
    flexDirection: "column",
  },
  roomTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  roomSubtitle: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  joinButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 24px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    border: "1px solid #DBDBDB",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#8E8E8E",
    textAlign: "center",
  },
  // 사이드바 스타일
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9998,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "350px",
    height: "100vh",
    backgroundColor: "#FFFFFF",
    boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #DBDBDB",
  },
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
  },
  closeButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#262626",
  },
  profileSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    borderBottom: "1px solid #DBDBDB",
  },
  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
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
  },
  profileId: {
    fontSize: "14px",
    color: "#8E8E8E",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid #DBDBDB",
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    padding: "14px 0",
    fontSize: "14px",
    cursor: "pointer",
    color: "#8E8E8E",
  },
  activeTab: {
    color: "#0095F6",
    fontWeight: "600",
    borderBottom: "2px solid #0095F6",
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
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #DBDBDB",
    fontSize: "14px",
    backgroundColor: "#FAFAFA",
    outline: "none",
  },
  saveButton: {
    backgroundColor: "#0095F6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 0",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
  },
  logoutButton: {
    backgroundColor: "transparent",
    color: "#ED4956",
    border: "none",
    borderTop: "1px solid #DBDBDB",
    padding: "16px",
    marginTop: "auto",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    textAlign: "center",
  },
  // 반응형 스타일
  '@media (max-width: 768px)': {
    container: {
      padding: "16px",
    },
    sidebar: {
      width: "100%",
    },
  },
};

export default StudentDashboard;