import React, { useEffect, useState } from "react";
import ClassDropdown from "./shared/ClassDropdown";
import SectionTitle from "./shared/SectionTitle";

function StudentTab({ backend, headers, classes, selectedClassId, setSelectedClassId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (selectedClassId) fetchStudents();
  }, [selectedClassId]);

  const fetchStudents = async () => {
    const res = await fetch(`${backend}/students?class_id=eq.${selectedClassId}`, { headers });
    const data = await res.json();
    const sorted = data.sort((a, b) => a.student_id.localeCompare(b.student_id)); // ✅ 오름차순
    setStudents(sorted);
  };

  const updateStudent = async (id) => {
    const name = document.getElementById(`name-${id}`).value;
    const pw = document.getElementById(`pw-${id}`).value;
    if (!name || !pw) return alert("이름과 비밀번호를 모두 입력해주세요.");

    const res = await fetch(`${backend}/students?student_id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ name, password: pw }),
    });

    if (res.ok) fetchStudents();
    else alert("수정 실패");
  };

  const deleteStudent = async (id) => {
    if (!window.confirm(`${id} 학생을 삭제할까요?`)) return;

    await fetch(`${backend}/students?student_id=eq.${id}`, {
      method: "DELETE",
      headers,
    });

    fetchStudents();
  };

  return (
    <div>
      <SectionTitle>학생 계정 관리</SectionTitle>

      <ClassDropdown
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
      />

      <table style={tableStyle}>
        <thead style={{ backgroundColor: "#f0f0f0" }}>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>이름</th>
            <th style={th}>비밀번호</th>
            <th style={th}>수정</th>
            <th style={th}>삭제</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id}>
              <td style={td}>{s.student_id}</td>
              <td><input id={`name-${s.student_id}`} defaultValue={s.name} style={inputStyle} /></td>
              <td><input id={`pw-${s.student_id}`} placeholder="변경 시 입력" style={inputStyle} /></td>
              <td>
                <button onClick={() => updateStudent(s.student_id)} style={buttonStyle}>
                  수정
                </button>
              </td>
              <td>
                <button onClick={() => deleteStudent(s.student_id)} style={deleteBtnStyle}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #ccc",
  borderRadius: "6px",
  overflow: "hidden",
  marginTop: "1rem",
};

const th = {
  textAlign: "center",
  padding: "0.6rem",
};

const td = {
  textAlign: "center",
  padding: "0.6rem",
};

const inputStyle = {
  padding: "0.4rem 0.6rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  width: "90%",
};

const buttonStyle = {
  padding: "0.4rem 0.8rem",
  backgroundColor: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const deleteBtnStyle = {
  ...buttonStyle,
  backgroundColor: "#fff",
  color: "#c00",
  border: "1px solid #c00",
};

export default StudentTab;