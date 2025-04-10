import React, { useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function ClassTab({ classes, backend, headers, reloadClasses }) {
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    password: "1234",
    system_prompt: "토론 도와주는 교사 역할",
    rubric_prompt: "토론 평가하는 교사 역할",
    studentCount: 30,
  });

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
      <SectionTitle>반 관리</SectionTitle>

      {classes.map((cls) => (
        <div key={cls.class_id} style={listItemStyle}>
          {cls.name}
          <button onClick={() => deleteClass(cls.class_id)} style={deleteBtnStyle}>
            삭제
          </button>
        </div>
      ))}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setShowForm(!showForm)} style={toggleBtnStyle}>
          {showForm ? "입력 폼 닫기" : "반 추가"}
        </button>
      </div>

      {showForm && (
        <div style={formWrapperStyle}>
          <h4 style={{ marginBottom: "0.5rem" }}>새 반 생성</h4>

          <input
            name="name"
            placeholder="반 이름 (예: test)"
            value={newClass.name}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            name="password"
            placeholder="비밀번호"
            value={newClass.password}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            name="system_prompt"
            placeholder="시스템 프롬프트"
            value={newClass.system_prompt}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            name="rubric_prompt"
            placeholder="루브릭 프롬프트"
            value={newClass.rubric_prompt}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            name="studentCount"
            type="number"
            min={1}
            max={100}
            placeholder="학생 수"
            value={newClass.studentCount}
            onChange={handleChange}
            style={inputStyle}
          />
          <button onClick={createClass} style={createBtnStyle}>
            반 생성
          </button>
        </div>
      )}
    </div>
  );
}

const listItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "0.5rem 1rem",
  marginBottom: "0.5rem",
};

const deleteBtnStyle = {
  background: "none",
  border: "none",
  color: "#c00",
  cursor: "pointer",
};

const toggleBtnStyle = {
  marginTop: "0.5rem",
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const formWrapperStyle = {
  marginTop: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const inputStyle = {
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const createBtnStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default ClassTab;