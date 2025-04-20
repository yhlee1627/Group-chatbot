import React, { useEffect, useState } from "react";
import theme from "../../styles/theme";

function StudentTab({ backend, headers, classId }) {
  const [students, setStudents] = useState([]);
  const [showPassword, setShowPassword] = useState({});

  useEffect(() => {
    fetch(`${backend}/students?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        // 학생 ID를 기준으로 정렬 (숫자 형식으로 가정)
        const sortedData = data.sort((a, b) => {
          // 숫자 형태의 ID만 추출 (s01 -> 1)
          const aNum = parseInt(a.student_id.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.student_id.replace(/\D/g, '')) || 0;
          return aNum - bNum;
        });
        setStudents(sortedData);
      });
  }, [classId]);

  const togglePasswordVisibility = (studentId) => {
    setShowPassword({
      ...showPassword,
      [studentId]: !showPassword[studentId]
    });
  };

  const updateStudent = async (id) => {
    const name = document.getElementById(`name-${id}`).value;
    const pw = document.getElementById(`pw-${id}`).value;
    if (!pw) return alert("비밀번호를 입력해주세요.");

    try {
      const response = await fetch(`${backend}/students?student_id=eq.${id}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ 
          name: name || null, // 빈 문자열이면 null로 저장
          password: pw 
        }),
      });

      if (response.ok) {
        // 성공적으로 업데이트된 학생 정보 가져오기
        const updatedStudent = await response.json();
        
        // 학생 목록 업데이트
        setStudents(students.map(student => 
          student.student_id === id ? updatedStudent[0] : student
        ));
        
        alert("✅ 수정 완료");
      } else {
        alert("❌ 수정 실패");
      }
    } catch (error) {
      console.error("학생 정보 업데이트 오류:", error);
      alert("❌ 수정 중 오류가 발생했습니다");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>클래스 학생 관리</h3>
      </div>

      <div style={styles.studentList}>
        {students.map((student) => (
          <div key={student.student_id} style={styles.studentCard}>
            <div style={styles.studentHeader}>
              <div style={styles.avatar}>
                {student.student_id.replace(/[^\d]/g, '')}
              </div>
              <span style={styles.studentId}>{student.student_id}</span>
            </div>
            
            <div style={styles.studentBody}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>이름</label>
                <input 
                  id={`name-${student.student_id}`} 
                  defaultValue={student.name || ''} 
                  placeholder="학생 이름 입력"
                  style={styles.input} 
                />
              </div>
              
              <div style={styles.fieldGroup}>
                <label style={styles.label}>비밀번호</label>
                <div style={styles.passwordField}>
                  <input 
                    id={`pw-${student.student_id}`} 
                    type={showPassword[student.student_id] ? "text" : "password"} 
                    defaultValue={student.password || ''} 
                    placeholder="비밀번호 입력"
                    style={styles.input} 
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePasswordVisibility(student.student_id)}
                    style={styles.passwordToggle}
                  >
                    {showPassword[student.student_id] ? '숨기기' : '보기'}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={styles.studentFooter}>
              <button 
                onClick={() => updateStudent(student.student_id)} 
                style={styles.saveButton}
              >
                업데이트
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: `1px solid ${theme.NEUTRAL_BORDER}`,
    paddingBottom: "16px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
    margin: "0",
  },
  studentList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  studentCard: {
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    transition: "all 0.2s ease",
    boxShadow: theme.SHADOW_SM,
    ":hover": {
      boxShadow: theme.SHADOW_MD,
      transform: "translateY(-2px)",
    },
  },
  studentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: theme.MAIN_COLOR,
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
  },
  studentId: {
    fontSize: "16px",
    fontWeight: "600",
    color: theme.NEUTRAL_TEXT,
  },
  studentBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: theme.NEUTRAL_LIGHT_TEXT,
    fontWeight: "600",
  },
  input: {
    padding: "12px 14px",
    fontSize: "14px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: theme.MAIN_COLOR,
    },
  },
  passwordField: {
    position: "relative",
    display: "flex",
    width: "100%",
  },
  passwordToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: theme.MAIN_COLOR,
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: theme.MAIN_LIGHT,
    },
  },
  studentFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  saveButton: {
    backgroundColor: theme.MAIN_COLOR,
    color: "#FFFFFF",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: theme.MAIN_DARK,
    },
  },
};

export default StudentTab;