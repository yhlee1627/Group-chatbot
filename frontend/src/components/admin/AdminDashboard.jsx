import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassTab from "./ClassTab";
import StudentTab from "./StudentTab";
import TeacherTab from "./TeacherTab";
import RoomTab from "./RoomTab";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const [classes, setClasses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [adminName, setAdminName] = useState("관리자");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const adminId = localStorage.getItem("adminId");

  const backend = import.meta.env.VITE_BACKEND_URL;
  const headers = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchClasses();
    fetchTopics();
    fetchAdminInfo();
  }, []);

  const fetchData = async (table) => {
    try {
      const res = await fetch(`${backend}/${table}`, { headers });
      if (!res.ok) throw new Error(`${table} fetch failed`);
      return await res.json();
    } catch (err) {
      console.error(`❌ ${table} 불러오기 실패:`, err);
      return [];
    }
  };

  const fetchClasses = async () => {
    const data = await fetchData("classes");
    setClasses(data);
    if (!selectedClassId && data.length > 0) {
      setSelectedClassId(data[0].class_id);
    }
  };

  const fetchTopics = async () => {
    const data = await fetchData("topics");
    setTopics(data);
  };

  const fetchAdminInfo = async () => {
    if (!adminId) return;

    try {
      const res = await fetch(`${backend}/admins?admin_id=eq.${adminId}`, { headers });
      if (!res.ok) throw new Error("Admin info fetch failed");
      
      const data = await res.json();
      if (data.length > 0) {
        const name = data[0].name || adminId;
        setAdminName(name);
        setEditName(name);
      }
    } catch (err) {
      console.error("❌ 관리자 정보 불러오기 실패:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
    setEditName(adminName);
    setEditPassword("");
    setIsEditingName(false);
    setIsEditingPassword(false);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  const updateProfile = async () => {
    // 변경사항이 없으면 저장하지 않음
    if (!isEditingName && !isEditingPassword) {
      closeProfileModal();
      return;
    }

    const updateData = {};
    if (isEditingName) {
      updateData.name = editName.trim() || null;
    }
    if (isEditingPassword && editPassword.trim()) {
      updateData.password = editPassword.trim();
    }

    if (Object.keys(updateData).length === 0) {
      closeProfileModal();
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${backend}/admins?admin_id=eq.${adminId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0 && isEditingName) {
          setAdminName(data[0].name || adminId);
        }
        alert("✅ 정보가 업데이트되었습니다.");
        closeProfileModal();
      } else {
        alert("❌ 정보 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("정보 업데이트 중 오류 발생:", error);
      alert("❌ 정보 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabLabels = ["반 관리", "학생 계정 관리", "교사 계정 관리", "채팅방 관리"];
  const tabIcons = ["🏫", "👨‍👩‍👧‍👦", "👨‍🏫", "💬"];

  return (
    <div style={styles.container}>
      {/* 헤더 섹션 */}
      <div style={styles.header}>
        <h1 style={styles.title}>관리자 대시보드</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </div>

      {/* 프로필 섹션 */}
      <div style={styles.profileSection}>
        <div style={styles.profileAvatar}>👑</div>
        <div style={styles.profileInfo}>
          <h2 style={styles.profileName}>{adminName}</h2>
          <p style={styles.profileDetails}>관리자 ID: {adminId}</p>
          <button onClick={openProfileModal} style={styles.editProfileButton}>
            프로필 수정
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div style={styles.tabContainer}>
        {tabLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index + 1)}
            style={{
              ...styles.tabButton,
              ...(activeTab === index + 1 ? styles.activeTab : {})
            }}
          >
            <span style={styles.tabIcon}>{tabIcons[index]}</span>
            <span style={styles.tabLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* 구분선 */}
      <div style={styles.divider}></div>

      {/* 탭 콘텐츠 */}
      <div style={styles.tabContent}>
        {activeTab === 1 && (
          <ClassTab
            classes={classes}
            backend={backend}
            headers={headers}
            reloadClasses={fetchClasses}
          />
        )}

        {activeTab === 2 && selectedClassId && (
          <StudentTab
            backend={backend}
            headers={headers}
            classes={classes}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
          />
        )}

        {activeTab === 3 && (
          <TeacherTab
            backend={backend}
            headers={headers}
            classes={classes}
          />
        )}

        {activeTab === 4 && selectedClassId && topics.length > 0 && (
          <RoomTab
            backend={backend}
            headers={headers}
            classes={classes}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            topics={topics}
          />
        )}
      </div>

      {/* 프로필 수정 모달 */}
      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>프로필 수정</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>이름</label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setIsEditingName(true);
                  }}
                  style={styles.formInput}
                  placeholder="이름을 입력하세요"
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>비밀번호</label>
              <div style={styles.inputWrapper}>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    setIsEditingPassword(true);
                  }}
                  style={styles.formInput}
                  placeholder="새 비밀번호 입력"
                />
              </div>
              <p style={styles.passwordHint}>
                변경하지 않으려면 비워두세요
              </p>
            </div>
            
            <div style={styles.modalActions}>
              <button 
                onClick={closeProfileModal} 
                style={styles.cancelButton}
                disabled={isSaving}
              >
                취소
              </button>
              <button 
                onClick={updateProfile} 
                style={styles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "935px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#FAFAFA",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#262626",
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
  logoutButton: {
    backgroundColor: "transparent",
    color: "#0095F6",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px",
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    marginBottom: "40px",
  },
  profileAvatar: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    backgroundColor: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "56px",
    marginRight: "32px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
  },
  profileName: {
    fontSize: "24px",
    fontWeight: "400",
    margin: "0 0 12px 0",
  },
  profileDetails: {
    fontSize: "14px",
    color: "#8E8E8E",
    margin: "0 0 4px 0",
  },
  editProfileButton: {
    backgroundColor: "transparent",
    color: "#0095F6",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px 0",
    marginTop: "8px",
    alignSelf: "flex-start",
  },
  tabContainer: {
    display: "flex",
    justifyContent: "center",
    borderBottom: "1px solid #DBDBDB",
    marginBottom: "0",
  },
  tabButton: {
    backgroundColor: "transparent",
    border: "none",
    padding: "16px",
    cursor: "pointer",
    flex: 1,
    maxWidth: "200px",
    fontSize: "14px",
    color: "#8E8E8E",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.2s",
  },
  activeTab: {
    color: "#0095F6",
    fontWeight: "600",
    borderBottom: "2px solid #0095F6",
  },
  tabIcon: {
    fontSize: "24px",
  },
  tabLabel: {
    fontSize: "12px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#DBDBDB",
    margin: "0 0 24px 0",
  },
  tabContent: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    padding: "24px",
  },
  
  // 모달 스타일
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
  },
  modalTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "24px",
    textAlign: "center",
    color: "#262626",
    borderBottom: "1px solid #EFEFEF",
    paddingBottom: "16px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "8px",
    display: "block",
  },
  inputWrapper: {
    position: "relative",
  },
  formInput: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    boxSizing: "border-box",
  },
  passwordHint: {
    fontSize: "12px",
    color: "#8E8E8E",
    margin: "4px 0 0 0",
    fontStyle: "italic",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px",
    borderTop: "1px solid #EFEFEF",
    paddingTop: "16px",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "#8E8E8E",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveButton: {
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AdminDashboard;