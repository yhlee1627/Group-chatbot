import React, { useState } from "react";

function ClassTab({ classes, backend, headers, reloadClasses }) {
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    password: "1234",
    system_prompt: "토론 도와주는 교사 역할",
    rubric_prompt: "토론 평가하는 교사 역할",
    studentCount: 30,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewClass((prev) => ({ ...prev, [name]: value }));
  };

  const createClass = async () => {
    const { name, password, system_prompt, rubric_prompt, studentCount } = newClass;

    if (!name.trim()) {
      alert("반 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const classNumber = String(classes.length + 1).padStart(2, "0");
      const fullClassName = `${classNumber}_${name.trim()}`;

      const res = await fetch(`${backend}/classes`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          name: fullClassName,
          password,
          system_prompt,
          rubric_prompt,
        }),
      });

      const data = await res.json();
      const class_id = data?.[0]?.class_id;

      if (!res.ok || !class_id) {
        console.error("❌ 반 생성 실패", data);
        alert("반 생성에 실패했습니다.");
        return;
      }

      const studentRequests = Array.from({ length: parseInt(studentCount, 10) }, (_, i) => {
        const student_id = `${classNumber}s${String(i + 1).padStart(2, "0")}`;
        return fetch(`${backend}/students`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            student_id,
            name: `학생${i + 1}`,
            password: "1234",
            class_id,
          }),
        });
      });

      await Promise.all(studentRequests);

      alert("✅ 반과 학생이 생성되었습니다.");
      setShowForm(false);
      setNewClass({
        name: "",
        password: "1234",
        system_prompt: "토론 도와주는 교사 역할",
        rubric_prompt: "토론 평가하는 교사 역할",
        studentCount: 30,
      });
      reloadClasses();
    } catch (err) {
      console.error("❌ 요청 실패:", err);
      alert("반 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteClass = async (classId) => {
    if (!window.confirm("해당 반과 학생을 모두 삭제하시겠습니까?")) return;

    try {
      await fetch(`${backend}/students?class_id=eq.${classId}`, {
        method: "DELETE",
        headers,
      });

      const res = await fetch(`${backend}/classes?class_id=eq.${classId}`, {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
      });

      if (res.ok) {
        alert("✅ 반이 성공적으로 삭제되었습니다.");
        reloadClasses();
      } else {
        console.error("❌ 반 삭제 실패:", await res.text());
        alert("반 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("❌ 삭제 오류:", err);
      alert("반 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <div style={styles.headerContainer}>
        <h3 style={styles.sectionTitle}>반 목록</h3>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={styles.addButton}
        >
          {showForm ? "취소" : "새 반 추가 +"}
        </button>
      </div>

      {/* 반 목록 */}
      <div style={styles.classGrid}>
        {classes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏫</div>
            <p style={styles.emptyText}>등록된 반이 없습니다.</p>
            <p style={styles.emptySubtext}>
              위의 "새 반 추가 +" 버튼을 클릭하여 반을 추가하세요.
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.class_id} style={styles.classCard}>
              <div style={styles.classCardContent}>
                <div style={styles.classIcon}>🏫</div>
                <div style={styles.classInfo}>
                  <h4 style={styles.className}>{cls.name}</h4>
                  <p style={styles.classDetails}>
                    반 ID: {cls.class_id}
                  </p>
                  <p style={styles.classDetails}>
                    비밀번호: {cls.password}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => deleteClass(cls.class_id)} 
                style={styles.deleteButton}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      {/* 반 추가 폼 */}
      {showForm && (
        <div style={styles.formContainer}>
          <h4 style={styles.formTitle}>새 반 생성</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>반 이름</label>
            <input
              name="name"
              placeholder="반 이름 입력 (예: 3학년 1반)"
              value={newClass.name}
              onChange={handleChange}
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>비밀번호</label>
            <input
              name="password"
              placeholder="비밀번호"
              value={newClass.password}
              onChange={handleChange}
              style={styles.formInput}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>시스템 프롬프트</label>
            <textarea
              name="system_prompt"
              placeholder="토론을 도와주는 역할을 설명하세요"
              value={newClass.system_prompt}
              onChange={handleChange}
              style={{...styles.formInput, minHeight: "80px"}}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>루브릭 프롬프트</label>
            <textarea
              name="rubric_prompt"
              placeholder="토론을 평가하는 역할을 설명하세요"
              value={newClass.rubric_prompt}
              onChange={handleChange}
              style={{...styles.formInput, minHeight: "80px"}}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>학생 수</label>
            <input
              name="studentCount"
              type="number"
              min={1}
              max={100}
              placeholder="학생 수"
              value={newClass.studentCount}
              onChange={handleChange}
              style={styles.formInput}
            />
          </div>
          
          <button 
            onClick={createClass} 
            style={isSubmitting ? styles.submitButtonDisabled : styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "생성 중..." : "반 생성하기"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#262626",
    margin: 0,
  },
  addButton: {
    backgroundColor: "#0095F6",
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  classGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  classCard: {
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "white",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  classCardContent: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  classIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginRight: "16px",
  },
  classInfo: {
    flex: 1,
  },
  className: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
  },
  classDetails: {
    fontSize: "14px",
    color: "#8E8E8E",
    margin: "0 0 4px 0",
  },
  deleteButton: {
    backgroundColor: "transparent",
    color: "#ED4956",
    border: "none",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    alignSelf: "flex-end",
    transition: "background-color 0.2s",
  },
  formContainer: {
    backgroundColor: "white",
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
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
    color: "#262626",
    marginBottom: "8px",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    boxSizing: "border-box",
  },
  submitButton: {
    backgroundColor: "#0095F6",
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    width: "100%",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background-color 0.2s",
  },
  submitButtonDisabled: {
    backgroundColor: "#B2DFFC",
    color: "white",
    fontWeight: "600",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    width: "100%",
    fontSize: "14px",
    cursor: "not-allowed",
    marginTop: "8px",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "white",
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#262626",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#8E8E8E",
    margin: 0,
  },
};

export default ClassTab;