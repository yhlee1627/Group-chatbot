import React, { useEffect, useState } from "react";

function StudentTab({ backend, headers, classId }) {
  const [students, setStudents] = useState([]);
  const [showPassword, setShowPassword] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

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

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.student_id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const toggleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      setIsAllSelected(false);
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
      if (selectedStudents.length + 1 === students.length) {
        setIsAllSelected(true);
      }
    }
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
        <div style={styles.actions}>
          <button 
            style={styles.selectAllButton}
            onClick={toggleSelectAll}
          >
            {isAllSelected ? '전체 선택 해제' : '전체 선택'}
          </button>
        </div>
      </div>

      <div style={styles.studentList}>
        {students.map((student) => (
          <div key={student.student_id} style={styles.studentCard}>
            <div style={styles.studentHeader}>
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.student_id)}
                onChange={() => toggleSelectStudent(student.student_id)}
                style={styles.checkbox}
              />
              <div style={styles.avatar}>
                {student.student_id.replace(/[^\d]/g, '')}
              </div>
            </div>
            
            <div style={styles.studentBody}>
              <div style={styles.idField}>
                <span style={styles.studentId}>{student.student_id}</span>
              </div>
              
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
    borderRadius: "4px",
    padding: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid #DBDBDB",
    paddingBottom: "16px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#262626",
    margin: "0",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  selectAllButton: {
    backgroundColor: "transparent",
    color: "#0095F6",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px",
  },
  studentList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },
  studentCard: {
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
  },
  studentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#0095F6",
    cursor: "pointer",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
  },
  studentBody: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  idField: {
    marginBottom: "4px",
  },
  studentId: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    color: "#8E8E8E",
    fontWeight: "600",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FFFFFF",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  passwordField: {
    position: "relative",
    display: "flex",
    width: "100%",
  },
  passwordToggle: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#0095F6",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  studentFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
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
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#1877F2",
    },
  },
};

export default StudentTab;