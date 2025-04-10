import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function StudentTab({ backend, headers, classId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch(`${backend}/students?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then(setStudents);
  }, [classId]);

  const updateStudent = async (id) => {
    const name = document.getElementById(`name-${id}`).value;
    const pw = document.getElementById(`pw-${id}`).value;
    if (!name || !pw) return alert("이름과 비밀번호를 모두 입력해주세요.");

    await fetch(`${backend}/students?student_id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ name, password: pw }),
    });

    alert("✅ 수정 완료");
  };

  return (
    <div>
      <SectionTitle>학생 관리</SectionTitle>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>비밀번호</th>
            <th>수정</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id}>
              <td>{s.student_id}</td>
              <td><input id={`name-${s.student_id}`} defaultValue={s.name} style={styles.input} /></td>
              <td><input id={`pw-${s.student_id}`} type="password" style={styles.input} /></td>
              <td><button onClick={() => updateStudent(s.student_id)} style={styles.button}>수정</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  input: {
    padding: "0.3rem",
    width: "90%",
  },
  button: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    padding: "0.3rem 0.7rem",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default StudentTab;