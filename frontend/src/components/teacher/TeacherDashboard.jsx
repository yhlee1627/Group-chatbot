import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentTab from "./StudentTab";
import CreateTab from "./CreateTab";
import ManageTab from "./ManageTab";
import EvaluateTab from "./EvaluateTab";
import theme from "../../styles/theme";

function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const [teacherName, setTeacherName] = useState("교사");
  const [className, setClassName] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [profileActiveTab, setProfileActiveTab] = useState("name");
  const [currentName, setCurrentName] = useState("");
  const [isAdminAccess, setIsAdminAccess] = useState(localStorage.getItem("isAdmin") === "true");
  
  const navigate = useNavigate();
  const classId = localStorage.getItem("classId");
  const teacherId = localStorage.getItem("teacherId");

  const backend = import.meta.env.VITE_BACKEND_URL;
  const headers = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  // 교사 정보 및 클래스 정보 가져오기
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 로컬 스토리지에서 교사 ID와 반 ID 가져오기
        const teacherId = localStorage.getItem("teacherId");
        const classId = localStorage.getItem("classId");
        const teacherName = localStorage.getItem("teacherName");

        if (!teacherId || !classId) {
          navigate("/teacher-login");
          return;
        }

        setTeacherId(teacherId);
        setClassId(classId);
        setTeacherName(teacherName);

        // Backend URL과 headers 설정
        const backend = import.meta.env.VITE_BACKEND_URL;
        const headers = {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        };

        // 반 정보 가져오기
        const classResponse = await fetch(
          `${backend}/classes?class_id=eq.${classId}`,
          { headers }
        );
        const classData = await classResponse.json();
        if (classData.length > 0) {
          setClassName(classData[0].name || "");
        }

        // 나머지 데이터 가져오기...

        // 학생 목록 가져오기
        const studentsResponse = await fetch(
          `${backend}/students?class_id=eq.${classId}`,
          { headers }
        );
        // 이하 동일...
      } catch (error) {
        console.error("정보를 가져오는 중 오류 발생:", error);
      }
    }

    if (teacherId && classId) {
      fetchData();
    } else {
      navigate("/teacher-login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/teacher-login");
  };

  const openSidebar = () => {
    setShowSidebar(true);
    setEditName(teacherName);
    setEditPassword("");
    setEditPassword2("");
    setProfileActiveTab("name");
  };

  const handleNameSave = async () => {
    if (!editName) {
      alert("이름을 입력해주세요.");
      return;
    }
    
    try {
      const response = await fetch(`${backend}/teachers?teacher_id=eq.${teacherId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ name: editName.trim() || null }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setTeacherName(data[0].name || teacherId);
          setCurrentName(data[0].name || teacherId);
        }
        alert("✅ 이름이 업데이트되었습니다.");
      } else {
        alert("❌ 정보 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("정보 업데이트 중 오류 발생:", error);
      alert("❌ 정보 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handlePasswordSave = async () => {
    if (!editPassword) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    
    if (editPassword !== editPassword2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    try {
      const response = await fetch(`${backend}/teachers?teacher_id=eq.${teacherId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ password: editPassword.trim() }),
      });

      if (response.ok) {
        alert("✅ 비밀번호가 업데이트되었습니다.");
        setEditPassword("");
        setEditPassword2("");
      } else {
        alert("❌ 비밀번호 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("비밀번호 업데이트 중 오류 발생:", error);
      alert("❌ 비밀번호 업데이트 중 오류가 발생했습니다.");
    }
  };

  const tabLabels = ["학생 관리", "채팅방 생성", "채팅방 관리", "채팅방 평가"];

  return (
    <div style={styles.container}>
      {/* 헤더 섹션 */}
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <img 
            src="/images/berry-icon.png" 
            alt="BerryChat" 
            style={styles.logo}
            onError={(e) => {
              e.target.style.display = 'none';
              document.getElementById('fallbackLogo').style.display = 'inline';
            }}
          />
          <span id="fallbackLogo" style={{display: 'none', marginRight: '8px'}}>🫐</span>
          <h1 style={styles.title}>교사 대시보드</h1>
        </div>
        <div style={styles.headerControls}>
          <button 
            onClick={openSidebar} 
            style={styles.iconButton}
            title="설정"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(130, 124, 209, 0.1)';
              e.currentTarget.style.color = theme.MAIN_COLOR;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
              e.currentTarget.style.backgroundColor = 'rgba(130, 124, 209, 0.1)';
              e.currentTarget.style.borderColor = theme.MAIN_COLOR;
              e.currentTarget.style.color = theme.MAIN_COLOR;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = theme.NEUTRAL_BORDER;
              e.currentTarget.style.color = theme.NEUTRAL_TEXT;
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 관리자 접속 모드 알림 배너 */}
      {isAdminAccess && (
        <div style={{
          backgroundColor: "rgba(255, 100, 100, 0.1)",
          padding: "8px 16px",
          borderRadius: "4px",
          margin: "0 20px 16px 20px",
          color: "#ff4757",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>🔒 관리자 접속 모드 - 현재 {className} 반의 교사 권한으로 접속 중입니다</span>
          <button
            onClick={() => {
              localStorage.removeItem("isAdmin");
              localStorage.removeItem("adminId");
              navigate("/admin-login");
            }}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #ff4757",
              padding: "4px 8px",
              borderRadius: "4px",
              color: "#ff4757",
              cursor: "pointer"
            }}
          >
            관리자 페이지로 돌아가기
          </button>
        </div>
      )}

      {/* 프로필 사이드바 */}
      {showSidebar && (
        <>
          <div style={styles.overlay} onClick={() => setShowSidebar(false)} />
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>내 프로필</h3>
              <button 
                onClick={() => setShowSidebar(false)} 
                style={styles.closeButton}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = theme.NEUTRAL_LIGHTEST;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12" stroke={theme.NEUTRAL_TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 4L12 12" stroke={theme.NEUTRAL_TEXT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div style={styles.profileSection}>
              <div style={styles.profileName}>{currentName}</div>
              <div style={styles.profileId}>{teacherId}</div>
              {className && (
                <div style={styles.profileClass}>클래스: {className}</div>
              )}
            </div>

            <div style={styles.sidebarTabContainer}>
              <button 
                onClick={() => setProfileActiveTab("name")} 
                style={{
                  ...styles.sidebarTabButton,
                  ...(profileActiveTab === "name" ? styles.sidebarActiveTab : {})
                }}>
                이름 변경
              </button>
              <button 
                onClick={() => setProfileActiveTab("password")} 
                style={{
                  ...styles.sidebarTabButton,
                  ...(profileActiveTab === "password" ? styles.sidebarActiveTab : {})
                }}>
                비밀번호 변경
              </button>
            </div>

            {profileActiveTab === "name" && (
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

            {profileActiveTab === "password" && (
              <div style={styles.formSection}>
                <label style={styles.inputLabel}>새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새 비밀번호"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
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

      {/* 탭 메뉴 */}
      <div style={styles.tabContainer}>
        {tabLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index + 1)}
            style={{
              ...styles.tabButton,
              ...(activeTab === index + 1 ? styles.activeTab : {}),
              ...styles.tabButtonHover
            }}
          >
            <span style={styles.tabLabel}>{label}</span>
            {index < tabLabels.length - 1 && <div style={styles.tabDivider}></div>}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={styles.tabContent}>
        {activeTab === 1 && <StudentTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 2 && <CreateTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 3 && <ManageTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 4 && <EvaluateTab backend={backend} headers={headers} classId={classId} />}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: theme.MAIN_LIGHT,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    boxShadow: theme.SHADOW_SM,
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    width: "32px",
    height: "32px",
    marginRight: "12px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
    color: theme.MAIN_COLOR,
  },
  headerControls: {
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
  profileSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 0",
    marginBottom: "20px",
    borderBottom: `1px solid rgba(130, 124, 209, 0.2)`,
  },
  profileName: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
  },
  profileId: {
    margin: "4px 0",
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
  },
  profileClass: {
    margin: "4px 0",
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
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
    padding: "20px",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: `1px solid rgba(130, 124, 209, 0.2)`,
    paddingBottom: "16px",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
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
  sidebarTabContainer: {
    display: "flex",
    marginBottom: "20px",
  },
  sidebarTabButton: {
    flex: 1,
    padding: "14px 0",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: theme.NEUTRAL_LIGHT_TEXT,
    textAlign: "center",
  },
  sidebarActiveTab: {
    backgroundColor: "#f5f3ff",
    color: theme.MAIN_COLOR,
    fontWeight: "600",
    borderBottom: `2px solid ${theme.MAIN_COLOR}`,
  },
  formSection: {
    marginBottom: "20px",
  },
  inputLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_MD,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "16px",
    transition: "border-color 0.2s ease",
  },
  saveButton: {
    backgroundColor: theme.MAIN_COLOR,
    color: "#FFFFFF",
    border: "none",
    borderRadius: theme.ROUNDED_MD,
    padding: "12px 0",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
    transition: "background-color 0.2s ease",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    overflow: "hidden",
    boxShadow: theme.SHADOW_SM,
    marginBottom: "24px",
    flexWrap: "wrap",
    position: "relative",
  },
  tabButton: {
    flex: 1,
    minWidth: "120px",
    padding: '16px 0',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    borderBottom: `3px solid transparent`,
    color: theme.NEUTRAL_LIGHT_TEXT,
    fontWeight: "500",
    position: "relative",
    overflow: "hidden",
  },
  tabButtonHover: {
    ':hover': {
      backgroundColor: 'rgba(130, 124, 209, 0.05)',
      color: theme.MAIN_COLOR,
    }
  },
  activeTab: {
    backgroundColor: "#f5f3ff",
    borderBottom: `3px solid ${theme.MAIN_COLOR}`,
    color: theme.MAIN_COLOR,
    fontWeight: "600",
    boxShadow: "0 -2px 6px rgba(130, 124, 209, 0.08)",
  },
  tabLabel: {
    fontSize: "14px",
    position: "relative",
    zIndex: 1,
    letterSpacing: "0.3px",
  },
  tabDivider: {
    position: "absolute",
    right: 0,
    top: "20%",
    height: "60%",
    width: "1px",
    backgroundColor: "rgba(130, 124, 209, 0.2)",
  },
  tabContent: {
    backgroundColor: "#FFFFFF",
    padding: "24px",
    borderRadius: theme.ROUNDED_LG,
    boxShadow: theme.SHADOW_SM,
    minHeight: "400px",
    border: "1px solid rgba(130, 124, 209, 0.1)",
    flexGrow: 1,
    overflowY: "auto",
  },
};

export default TeacherDashboard;