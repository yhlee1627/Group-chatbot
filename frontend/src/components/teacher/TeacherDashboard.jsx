import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentTab from "./StudentTab";
import CreateTab from "./CreateTab";
import ManageTab from "./ManageTab";
import EvaluateTab from "./EvaluateTab";

function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const [teacherName, setTeacherName] = useState("교사");
  const [className, setClassName] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    const fetchTeacherInfo = async () => {
      try {
        // 교사 정보 가져오기
        const teacherResponse = await fetch(
          `${backend}/teachers?teacher_id=eq.${teacherId}`,
          { headers }
        );
        const teacherData = await teacherResponse.json();
        if (teacherData.length > 0) {
          const name = teacherData[0].name || teacherId;
          setTeacherName(name);
          setEditName(name);
        }

        // 클래스 정보 가져오기
        const classResponse = await fetch(
          `${backend}/classes?class_id=eq.${classId}`,
          { headers }
        );
        const classData = await classResponse.json();
        if (classData.length > 0) {
          setClassName(classData[0].name || "");
        }
      } catch (error) {
        console.error("정보를 가져오는 중 오류 발생:", error);
      }
    };

    if (teacherId && classId) {
      fetchTeacherInfo();
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/teacher-login");
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
    setEditName(teacherName);
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
      const response = await fetch(`${backend}/teachers?teacher_id=eq.${teacherId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0 && isEditingName) {
          setTeacherName(data[0].name || teacherId);
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

  const tabLabels = ["학생 관리", "채팅방 생성", "채팅방 관리", "채팅방 평가"];
  const tabIcons = ["👨‍👩‍👧‍👦", "➕", "💬", "🔍"];

  return (
    <div style={styles.container}>
      {/* 헤더 섹션 */}
      <div style={styles.header}>
        <h1 style={styles.title}>교사 대시보드</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          로그아웃
        </button>
      </div>

      {/* 프로필 섹션 */}
      <div style={styles.profileSection}>
        <div style={styles.profileAvatar}>📖</div>
        <div style={styles.profileInfo}>
          <h2 style={styles.profileName}>{teacherName}</h2>
          <p style={styles.profileDetails}>교사 ID: {teacherId}</p>
          <p style={styles.profileDetails}>클래스: {className}</p>
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
        {activeTab === 1 && <StudentTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 2 && <CreateTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 3 && <ManageTab backend={backend} headers={headers} classId={classId} />}
        {activeTab === 4 && <EvaluateTab backend={backend} headers={headers} classId={classId} />}
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

export default TeacherDashboard;