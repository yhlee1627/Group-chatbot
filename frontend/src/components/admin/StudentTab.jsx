import React, { useEffect, useState } from "react";
import ClassDropdown from "./shared/ClassDropdown";
import SectionTitle from "./shared/SectionTitle";

function StudentTab({ backend, headers, classes, selectedClassId, setSelectedClassId }) {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [isEditing, setIsEditing] = useState({});

  useEffect(() => {
    if (selectedClassId) fetchStudents();
  }, [selectedClassId]);

  const fetchStudents = async () => {
    const res = await fetch(`${backend}/students?class_id=eq.${selectedClassId}`, { headers });
    const data = await res.json();
    // 학생 ID로 숫자 정렬
    const sorted = data.sort((a, b) => {
      const idA = parseInt(a.student_id.replace(/\D/g, '')) || 0;
      const idB = parseInt(b.student_id.replace(/\D/g, '')) || 0;
      return idA - idB;
    });
    setStudents(sorted);
    setSelectedStudents([]);
    setShowPasswords({});
    setIsEditing({});
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.student_id));
    }
  };

  const startEditing = (id) => {
    setIsEditing(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const updateStudent = async (id) => {
    const nameInput = document.getElementById(`name-${id}`);
    const pwInput = document.getElementById(`pw-${id}`);
    
    const name = nameInput.value; // 이름은 선택적
    const pw = pwInput.value;
    
    if (!pw) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(`${backend}/students?student_id=eq.${id}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ 
          name, 
          password: pw 
        }),
      });

      if (res.ok) {
        const updatedStudent = await res.json();
        // 즉시 UI 업데이트
        setStudents(prev => 
          prev.map(s => s.student_id === id ? {...s, name} : s)
        );
        setIsEditing(prev => ({
          ...prev,
          [id]: false
        }));
        alert("학생 정보가 업데이트되었습니다.");
      } else {
        alert("수정 실패: " + await res.text());
      }
    } catch (error) {
      alert("오류 발생: " + error.message);
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm(`${id} 학생을 삭제할까요?`)) return;

    try {
      const res = await fetch(`${backend}/students?student_id=eq.${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setStudents(prev => prev.filter(s => s.student_id !== id));
        setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
        alert("학생이 삭제되었습니다.");
      } else {
        alert("삭제 실패: " + await res.text());
      }
    } catch (error) {
      alert("오류 발생: " + error.message);
    }
  };

  const deleteMultipleStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    if (!window.confirm(`선택한 ${selectedStudents.length}명의 학생을 삭제할까요?`)) return;

    try {
      // 선택된 학생 ID들을 쉼표로 구분된 문자열로 변환
      const studentIds = selectedStudents.map(id => `'${id}'`).join(',');
      
      const res = await fetch(`${backend}/students?student_id=in.(${studentIds})`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setStudents(prev => prev.filter(s => !selectedStudents.includes(s.student_id)));
        setSelectedStudents([]);
        alert("선택한 학생들이 삭제되었습니다.");
      } else {
        alert("일괄 삭제 실패: " + await res.text());
      }
    } catch (error) {
      alert("오류 발생: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <SectionTitle>학생 계정 관리</SectionTitle>
        
        <div style={styles.actionBar}>
          <ClassDropdown
            classes={classes}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
          />
          
          {students.length > 0 && (
            <div style={styles.selectionControls}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={toggleAllStudents}
                />
                전체 선택
              </label>
              
              {selectedStudents.length > 0 && (
                <button 
                  onClick={deleteMultipleStudents} 
                  style={styles.deleteMultipleBtn}
                >
                  🗑️ {selectedStudents.length}명 삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {students.length === 0 ? (
        <div style={styles.emptyState}>
          {selectedClassId ? (
            <p>이 클래스에 학생이 없습니다.</p>
          ) : (
            <p>클래스를 선택해주세요.</p>
          )}
        </div>
      ) : (
        <div style={styles.studentGrid}>
          {students.map((s) => (
            <div 
              key={s.student_id} 
              style={{
                ...styles.studentCard,
                ...(selectedStudents.includes(s.student_id) ? styles.selectedCard : {})
              }}
            >
              <div style={styles.cardHeader}>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(s.student_id)}
                  onChange={() => toggleStudentSelection(s.student_id)}
                  style={styles.checkbox}
                />
                <div style={styles.avatar}>
                  📚
                </div>
                <div style={styles.studentId}>{s.student_id}</div>
              </div>
              
              <div style={styles.cardContent}>
                <div style={styles.field}>
                  <label style={styles.label}>이름</label>
                  <input 
                    id={`name-${s.student_id}`}
                    defaultValue={s.name || ''}
                    placeholder="이름 (선택)"
                    disabled={!isEditing[s.student_id]}
                    style={{
                      ...styles.input,
                      ...(isEditing[s.student_id] ? styles.activeInput : styles.disabledInput)
                    }} 
                  />
                </div>
                
                <div style={styles.field}>
                  <label style={styles.label}>비밀번호</label>
                  <div style={styles.passwordContainer}>
                    <input 
                      id={`pw-${s.student_id}`}
                      type={showPasswords[s.student_id] ? "text" : "password"}
                      placeholder={isEditing[s.student_id] ? "새 비밀번호 입력" : "••••••••"}
                      disabled={!isEditing[s.student_id]}
                      style={{
                        ...styles.input,
                        ...styles.passwordInput,
                        ...(isEditing[s.student_id] ? styles.activeInput : styles.disabledInput)
                      }} 
                    />
                    <button 
                      onClick={() => togglePasswordVisibility(s.student_id)}
                      style={styles.eyeButton}
                      disabled={!isEditing[s.student_id]}
                    >
                      {showPasswords[s.student_id] ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={styles.cardActions}>
                {isEditing[s.student_id] ? (
                  <button 
                    onClick={() => updateStudent(s.student_id)} 
                    style={styles.saveButton}
                  >
                    ✅ 저장
                  </button>
                ) : (
                  <button 
                    onClick={() => startEditing(s.student_id)} 
                    style={styles.editButton}
                  >
                    ✏️ 수정
                  </button>
                )}
                <button 
                  onClick={() => deleteStudent(s.student_id)} 
                  style={styles.deleteButton}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 스타일
const styles = {
  container: {
    padding: "10px",
    backgroundColor: "#FAFAFA",
    borderRadius: "8px",
    width: "100%",
  },
  header: {
    marginBottom: "20px",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px",
    flexWrap: "wrap",
    gap: "10px",
  },
  selectionControls: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  emptyState: {
    textAlign: "center",
    padding: "30px",
    fontSize: "16px",
    color: "#8E8E8E",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #dbdbdb",
  },
  studentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "15px",
  },
  studentCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #dbdbdb",
    overflow: "hidden",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  selectedCard: {
    boxShadow: "0 0 0 2px #0095f6",
    borderColor: "#0095f6",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    padding: "12px 15px",
    borderBottom: "1px solid #efefef",
    backgroundColor: "#FAFAFA",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#efefef",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#0095f6",
    marginRight: "10px",
    fontSize: "20px",
  },
  studentId: {
    fontSize: "16px",
    fontWeight: "600",
    flexGrow: 1,
  },
  checkbox: {
    marginRight: "10px",
    cursor: "pointer",
    width: "16px",
    height: "16px",
  },
  cardContent: {
    padding: "15px",
  },
  field: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#8E8E8E",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #dbdbdb",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
  },
  activeInput: {
    backgroundColor: "white",
    borderColor: "#dbdbdb",
  },
  disabledInput: {
    backgroundColor: "#FAFAFA",
    color: "#262626",
    cursor: "default",
  },
  passwordContainer: {
    position: "relative",
    display: "flex",
  },
  passwordInput: {
    paddingRight: "40px",
  },
  eyeButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#8E8E8E",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  cardActions: {
    display: "flex",
    borderTop: "1px solid #efefef",
  },
  buttonBase: {
    flex: 1,
    padding: "10px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  editButton: {
    flex: 1,
    padding: "10px",
    color: "#0095f6",
    backgroundColor: "white",
    border: "none",
    borderRight: "1px solid #efefef",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    padding: "10px",
    color: "white",
    backgroundColor: "#0095f6",
    border: "none",
    borderRight: "1px solid #efefef",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteButton: {
    flex: 1,
    padding: "10px",
    color: "#ED4956",
    backgroundColor: "white",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteMultipleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    backgroundColor: "#ED4956",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default StudentTab;