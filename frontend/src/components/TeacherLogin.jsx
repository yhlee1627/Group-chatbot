import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TeacherLogin() {
  const [teacherId, setTeacherId] = useState("");
  const [password, setPassword] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/classes`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].class_id);
      });
  }, []);

  const handleLogin = async () => {
    if (!teacherId || !password || !selectedClassId) {
      alert("아이디, 비밀번호, 반을 모두 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/teachers?teacher_id=eq.${teacherId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      const teacher = data[0];

      if (teacher?.password === password && teacher?.class_id === selectedClassId) {
        localStorage.setItem("teacherId", teacherId);
        localStorage.setItem("classId", selectedClassId);
        localStorage.setItem("teacherName", teacher.name || "교사");
        navigate("/teacher");
      } else {
        alert("❌ 비밀번호가 틀렸거나 반이 일치하지 않습니다.");
      }
    } catch (err) {
      alert("❌ 존재하지 않는 교사 ID입니다.");
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
      style={formStyle}
    >
      <h2 style={headerStyle}>교사 로그인</h2>

      <label style={labelStyle}>반 선택</label>
      <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={inputStyle}>
        {classes.map((cls) => (
          <option key={cls.class_id} value={cls.class_id}>{cls.name}</option>
        ))}
      </select>

      <label style={labelStyle}>교사 ID</label>
      <input type="text" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>비밀번호</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

      <button type="submit" style={loginButtonStyle}>로그인</button>
      <button type="button" onClick={() => navigate("/")} style={mainButtonStyle}>메인 화면으로 돌아가기</button>
    </form>
  );
}

const formStyle = {
  maxWidth: "400px",
  margin: "5rem auto",
  padding: "2rem",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "2rem",
  fontSize: "1.5rem",
};

const labelStyle = { fontWeight: 500 };
const inputStyle = {
  width: "100%",
  marginBottom: "1.2rem",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const loginButtonStyle = {
  width: "100%",
  padding: "0.75rem",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "1rem",
  cursor: "pointer",
  marginBottom: "1rem",
};

const mainButtonStyle = {
  ...loginButtonStyle,
  backgroundColor: "#eee",
  color: "#333",
  border: "1px solid #ccc",
};

export default TeacherLogin;