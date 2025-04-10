import React from "react";
import { useNavigate } from "react-router-dom";

function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div style={{
      maxWidth: "400px",
      margin: "6rem auto",
      padding: "2rem",
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
      textAlign: "center"
    }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "1.8rem", fontWeight: 600 }}>
        AI 채팅 시스템
      </h1>

      <button
        onClick={() => navigate("/student-login")}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#2e7d32",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        학생 로그인
      </button>

      <button
        onClick={() => navigate("/teacher-login")}
        style={{
          width: "100%",
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        교사 로그인
      </button>

      <button
        onClick={() => navigate("/admin-login")}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: "#555",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        관리자 로그인
      </button>
    </div>
  );
}

export default LoginSelection;