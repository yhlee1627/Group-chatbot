import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";
import theme from "../../styles/theme";

function TeacherTab({ backend, headers, classes }) {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    id: "",
    name: "",
    password: "",
    class_id: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${backend}/teachers`, { headers });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      console.error("교사 목록 불러오기 실패:", error);
      alert("교사 목록을 불러오는 데 실패했습니다.");
    }
  };

  const createTeacher = async () => {
    const { id, name, password, class_id } = newTeacher;
    if (!id || !password || !class_id) {
      alert("ID, 비밀번호, 반은 필수 입력 항목입니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${backend}/teachers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          teacher_id: id,
          name: name || null, // 이름은 선택적
          password,
          class_id,
        }),
      });

      if (res.ok) {
        setNewTeacher({ id: "", name: "", password: "", class_id: "" });
        setShowForm(false);
        fetchTeachers();
        alert("✅ 교사가 성공적으로 추가되었습니다.");
      } else {
        const errorText = await res.text();
        alert(`❌ 교사 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("교사 추가 오류:", error);
      alert("교사 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTeacher = async (teacherId) => {
    if (!window.confirm(`정말 ${teacherId} 교사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`${backend}/teachers?teacher_id=eq.${teacherId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        fetchTeachers();
        alert("✅ 교사가 성공적으로 삭제되었습니다.");
      } else {
        alert("❌ 교사 삭제 실패");
      }
    } catch (error) {
      console.error("교사 삭제 오류:", error);
      alert("교사 삭제 중 오류가 발생했습니다.");
    }
  };

  const getClassNameById = (classId) => {
    const foundClass = classes.find((c) => c.class_id === classId);
    return foundClass ? foundClass.name : "배정된 반 없음";
  };

  const toggleTeacherDetails = (teacherId) => {
    if (selectedTeacher === teacherId) {
      setSelectedTeacher(null);
    } else {
      setSelectedTeacher(teacherId);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <SectionTitle>교사 계정 관리</SectionTitle>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? "취소" : "새 교사 추가 +"}
        </button>
      </div>

      {/* 교사 추가 폼 */}
      {showForm && (
        <div style={styles.formContainer}>
          <h4 style={styles.formTitle}>새 교사 계정 생성</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>교사 ID</label>
            <input
              placeholder="교사 ID를 입력하세요"
              value={newTeacher.id}
              onChange={(e) =>
                setNewTeacher({ ...newTeacher, id: e.target.value })
              }
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>이름 (선택)</label>
            <input
              placeholder="교사 이름을 입력하세요"
              value={newTeacher.name}
              onChange={(e) =>
                setNewTeacher({ ...newTeacher, name: e.target.value })
              }
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>비밀번호</label>
            <div style={styles.passwordContainer}>
              <input
                placeholder="비밀번호를 입력하세요"
                type={showPassword ? "text" : "password"}
                value={newTeacher.password}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, password: e.target.value })
                }
                style={styles.passwordInput}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>담당 반</label>
            <select
              value={newTeacher.class_id}
              onChange={(e) =>
                setNewTeacher({ ...newTeacher, class_id: e.target.value })
              }
              style={styles.formSelect}
            >
              <option value="">반을 선택하세요</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={createTeacher} 
            style={isSubmitting ? styles.submitButtonDisabled : styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "교사 추가하기"}
          </button>
        </div>
      )}

      {/* 교사 목록 */}
      {teachers.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>등록된 교사가 없습니다.</p>
          <p style={styles.emptySubtext}>
            "새 교사 추가 +" 버튼을 클릭하여 교사를 추가하세요.
          </p>
        </div>
      ) : (
        <div style={styles.teacherGrid}>
          {teachers.map((teacher) => (
            <div key={teacher.teacher_id} style={styles.teacherCard}>
              <div 
                style={styles.teacherCardHeader}
                onClick={() => toggleTeacherDetails(teacher.teacher_id)}
              >
                <div style={styles.teacherInfo}>
                  <h4 style={styles.teacherName}>{teacher.name || teacher.teacher_id}</h4>
                  <p style={styles.teacherId}>ID: {teacher.teacher_id}</p>
                </div>
                <div style={styles.classTag}>{getClassNameById(teacher.class_id)}</div>
              </div>
              
              {selectedTeacher === teacher.teacher_id && (
                <div style={styles.teacherDetails}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>반:</span>
                    <span style={styles.detailValue}>{getClassNameById(teacher.class_id)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>교사 ID:</span>
                    <span style={styles.detailValue}>{teacher.teacher_id}</span>
                  </div>
                  <button 
                    onClick={() => deleteTeacher(teacher.teacher_id)}
                    style={styles.deleteButton}
                  >
                    교사 삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.ROUNDED_LG,
    width: "100%",
    boxShadow: theme.SHADOW_SM,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  addButton: {
    backgroundColor: theme.MAIN_COLOR,
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: theme.ROUNDED_MD,
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: theme.MAIN_DARK,
    }
  },
  teacherGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  teacherCard: {
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_LG,
    backgroundColor: "white",
    overflow: "hidden",
    transition: "all 0.2s ease",
    boxShadow: theme.SHADOW_XS,
    "&:hover": {
      boxShadow: theme.SHADOW_MD,
      transform: "translateY(-2px)",
    }
  },
  teacherCardHeader: {
    display: "flex",
    alignItems: "center",
    padding: "20px",
    cursor: "pointer",
    position: "relative",
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: "0 0 4px 0",
  },
  teacherId: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    margin: 0,
  },
  classTag: {
    display: "inline-block",
    backgroundColor: "#F9F9FB",
    color: theme.NEUTRAL_TEXT,
    fontSize: "13px",
    fontWeight: "500",
    padding: "4px 10px",
    borderRadius: theme.ROUNDED_MD,
    marginLeft: "8px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
  },
  teacherDetails: {
    padding: "20px",
    borderTop: `1px solid ${theme.NEUTRAL_BORDER}`,
    backgroundColor: "#F9F9FB",
  },
  detailItem: {
    display: "flex",
    margin: "0 0 12px 0",
  },
  detailLabel: {
    width: "80px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    fontSize: "14px",
  },
  detailValue: {
    color: theme.NEUTRAL_TEXT,
    fontSize: "14px",
    fontWeight: "500",
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: theme.ERROR,
    border: `1px solid ${theme.ERROR}`,
    borderRadius: theme.ROUNDED_MD,
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "16px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(237, 73, 86, 0.1)",
    }
  },
  formContainer: {
    backgroundColor: "white",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_LG,
    padding: "24px",
    marginBottom: "24px",
    boxShadow: theme.SHADOW_SM,
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    marginTop: 0,
    marginBottom: "24px",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    marginBottom: "8px",
  },
  formInput: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_MD,
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    '&:focus': {
      borderColor: theme.MAIN_COLOR,
      outline: "none",
      boxShadow: `0 0 0 3px ${theme.MAIN_LIGHT}`,
    }
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_MD,
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    paddingRight: "70px",
    transition: "all 0.2s ease",
    '&:focus': {
      borderColor: theme.MAIN_COLOR,
      outline: "none",
      boxShadow: `0 0 0 3px ${theme.MAIN_LIGHT}`,
    }
  },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: theme.MAIN_COLOR,
    padding: "6px 8px",
    fontWeight: "500",
  },
  formSelect: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_MD,
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"%23262626\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    transition: "all 0.2s ease",
    '&:focus': {
      borderColor: theme.MAIN_COLOR,
      outline: "none",
      boxShadow: `0 0 0 3px ${theme.MAIN_LIGHT}`,
    }
  },
  submitButton: {
    backgroundColor: theme.MAIN_COLOR,
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: theme.ROUNDED_MD,
    padding: "12px 16px",
    width: "100%",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "16px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: theme.MAIN_DARK,
    }
  },
  submitButtonDisabled: {
    backgroundColor: theme.NEUTRAL_BORDER,
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: theme.ROUNDED_MD,
    padding: "12px 16px",
    width: "100%",
    fontSize: "14px",
    cursor: "not-allowed",
    marginTop: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    backgroundColor: "white",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: theme.ROUNDED_LG,
    marginBottom: "16px",
    boxShadow: theme.SHADOW_SM,
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    margin: 0,
  },
};

export default TeacherTab;