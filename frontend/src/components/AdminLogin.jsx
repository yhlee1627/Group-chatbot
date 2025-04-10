import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!adminId || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/admins?admin_id=eq.${adminId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      const admin = data[0]; // Supabase는 항상 배열을 반환

      if (admin?.password === password) {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminId", adminId);
        localStorage.setItem("adminName", admin.name || "관리자");
        navigate("/admin");
      } else {
        alert("❌ 비밀번호가 틀렸습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ 존재하지 않는 관리자 ID입니다.");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
      style={{
        maxWidth: "400px",
        margin: "5rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>
        관리자 로그인
      </h2>

      <label style={{ fontWeight: 500 }}>관리자 ID</label>
      <input
        type="text"
        placeholder="관리자 ID"
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "1rem",
          padding: "0.5rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      <label style={{ fontWeight: 500 }}>비밀번호</label>
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "1.5rem",
          padding: "0.5rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        로그인
      </button>

      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: "#eee",
          color: "#333",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        메인 화면으로 돌아가기
      </button>
    </form>
  );
}

export default AdminLogin;