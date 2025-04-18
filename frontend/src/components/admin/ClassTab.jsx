import React, { useState } from "react";

function ClassTab({ classes, backend, headers, reloadClasses }) {
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    password: "1234",
    system_prompt: "토론 도와주는 교사 역할",
    rubric_prompt: "토론 평가하는 교사 역할",
    studentCount: 30
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
      // 반 이름은 사용자 입력 그대로 사용
      const fullClassName = name.trim();

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

      // 반 번호 가져오기
      const classNumber = classes.length + 1;
      
      // 학생 ID 생성 및 등록
      const studentPromises = Array.from({ length: parseInt(studentCount, 10) }, (_, i) => {
        // 학생 ID는 '{반번호}s{학생번호}' 형식 (예: 1s01, 2s02)
        // 간결하지만 고유한 ID 형식
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

      const results = await Promise.allSettled(studentPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      let message = `✅ 반이 생성되었습니다. ${successCount}명의 학생이 추가되었습니다.`;
      if (failCount > 0) {
        message += ` ${failCount}명은 ID 충돌로 추가되지 않았습니다.`;
      }

      alert(message);
      setShowForm(false);
      setNewClass({
        name: "",
        password: "1234",
        system_prompt: "토론 도와주는 교사 역할",
        rubric_prompt: "토론 평가하는 교사 역할",
        studentCount: 30
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
      // 1. 해당 반에 속한 토픽 ID 목록 가져오기
      const topicsRes = await fetch(`${backend}/topics?class_id=eq.${classId}`, { headers });
      const topics = await topicsRes.json();
      const topicIds = topics.map(topic => topic.topic_id);
      console.log("삭제할 토픽:", topicIds);
      
      // 2. 토픽을 통해 연결된 방 ID 가져오기
      let roomIds = [];
      
      if (topicIds.length > 0) {
        // 개별 토픽 ID로 방 조회 (OR 구문에 문제가 있어 보임)
        for (const topicId of topicIds) {
          try {
            const roomsRes = await fetch(`${backend}/rooms?topic_id=eq.${topicId}`, { headers });
            if (roomsRes.ok) {
              const rooms = await roomsRes.json();
              if (Array.isArray(rooms)) {
                roomIds = [...roomIds, ...rooms.map(room => room.room_id)];
              }
            }
          } catch (err) {
            console.error(`토픽 ${topicId}의 방 조회 오류:`, err);
          }
        }
      }
      
      console.log("삭제할 채팅방:", roomIds);
      
      // 3. 각 방에 연결된 메시지 삭제
      for (const roomId of roomIds) {
        try {
          await fetch(`${backend}/messages?room_id=eq.${roomId}`, {
            method: "DELETE",
            headers,
          });
        } catch (msgErr) {
          console.error(`메시지 삭제 오류 (${roomId}):`, msgErr);
        }
      }
      
      // 4. 방 삭제
      for (const roomId of roomIds) {
        try {
          await fetch(`${backend}/rooms?room_id=eq.${roomId}`, {
            method: "DELETE",
            headers,
          });
        } catch (roomErr) {
          console.error(`방 삭제 오류 (${roomId}):`, roomErr);
        }
      }
      
      // 5. 토픽 삭제
      for (const topicId of topicIds) {
        try {
          await fetch(`${backend}/topics?topic_id=eq.${topicId}`, {
            method: "DELETE",
            headers,
          });
        } catch (topicErr) {
          console.error(`토픽 삭제 오류 (${topicId}):`, topicErr);
        }
      }

      // 6. 학생 삭제
      try {
        await fetch(`${backend}/students?class_id=eq.${classId}`, {
          method: "DELETE",
          headers,
        });
      } catch (studentErr) {
        console.error("학생 삭제 오류:", studentErr);
      }
      
      // 7. chats 테이블의 관련 행 삭제 (오류 메시지에서 발견된 추가 테이블)
      try {
        const chatsRes = await fetch(`${backend}/chats?class_id=eq.${classId}`, {
          method: "DELETE",
          headers,
        });
        if (!chatsRes.ok) {
          console.error("chats 삭제 실패:", await chatsRes.text());
        }
      } catch (chatsErr) {
        console.error("chats 삭제 오류:", chatsErr);
      }

      // 8. 마지막으로 반 삭제
      try {
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
          const errorText = await res.text();
          console.error("❌ 반 삭제 실패:", errorText);
          alert("반 삭제에 실패했습니다. 자세한 내용은 콘솔을 확인하세요.");
        }
      } catch (classErr) {
        console.error("반 삭제 오류:", classErr);
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