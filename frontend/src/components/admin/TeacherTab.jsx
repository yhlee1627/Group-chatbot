import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function TeacherTab({ backend, headers, classes }) {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    id: "",
    name: "",
    password: "",
    class_id: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const res = await fetch(`${backend}/teachers`, { headers });
    const data = await res.json();
    setTeachers(data);
  };

  const createTeacher = async () => {
    const { id, name, password, class_id } = newTeacher;
    if (!id || !name || !password || !class_id) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const res = await fetch(`${backend}/teachers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        teacher_id: id,
        name,
        password,
        class_id,
      }),
    });

    if (res.ok) {
      setNewTeacher({ id: "", name: "", password: "", class_id: "" });
      fetchTeachers();
    } else {
      alert("교사 추가 실패");
    }
  };

  return (
    <div>
      <SectionTitle>교사 계정 관리</SectionTitle>

      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>이름</th>
            <th style={styles.th}>반</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.teacher_id}>
              <td style={styles.td}>{t.teacher_id}</td>
              <td style={styles.td}>{t.name}</td>
              <td style={styles.td}>
                {classes.find((c) => c.class_id === t.class_id)?.name || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ marginTop: "2rem" }}>새 교사 추가</h4>

      <div style={styles.form}>
        <input
          placeholder="ID"
          value={newTeacher.id}
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, id: e.target.value })
          }
          style={styles.input}
        />
        <input
          placeholder="이름"
          value={newTeacher.name}
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, name: e.target.value })
          }
          style={styles.input}
        />
        <input
          placeholder="비밀번호"
          type="password"
          value={newTeacher.password}
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, password: e.target.value })
          }
          style={styles.input}
        />
        <select
          value={newTeacher.class_id}
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, class_id: e.target.value })
          }
          style={styles.input}
        >
          <option value="">반 선택</option>
          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.name}
            </option>
          ))}
        </select>

        <button onClick={createTeacher} style={styles.button}>
          교사 추가
        </button>
      </div>
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    textAlign: "center",
    borderCollapse: "collapse",
    border: "1px solid #ccc",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  thead: {
    backgroundColor: "#f0f0f0",
  },
  th: {
    padding: "0.75rem",
    fontWeight: "600",
  },
  td: {
    padding: "0.75rem",
    borderTop: "1px solid #eee",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    maxWidth: "400px",
  },
  input: {
    padding: "0.6rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    padding: "0.6rem",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

export default TeacherTab;