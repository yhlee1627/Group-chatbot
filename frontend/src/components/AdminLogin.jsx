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
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logo}>⚙️</div>
          <h1 style={styles.title}>관리자 로그인</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={styles.form}>
          <div style={styles.inputGroup}>
            <input 
              type="text" 
              value={adminId} 
              onChange={(e) => setAdminId(e.target.value)} 
              style={styles.input} 
              placeholder="관리자 ID"
            />
          </div>

          <div style={styles.inputGroup}>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input} 
              placeholder="비밀번호"
            />
          </div>

          <button type="submit" style={styles.loginButton}>
            로그인
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>또는</span>
          <span style={styles.dividerLine}></span>
        </div>

        <button 
          type="button" 
          onClick={() => navigate("/")} 
          style={styles.backButton}
        >
          메인 화면으로 돌아가기
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#FAFAFA",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  loginCard: {
    width: "350px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DBDBDB",
    borderRadius: "1px",
    padding: "40px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
  },
  logo: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: "0",
    color: "#262626",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputGroup: {
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "12px 8px",
    backgroundColor: "#FAFAFA",
    border: "1px solid #DBDBDB",
    borderRadius: "3px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    color: "#262626",
  },
  loginButton: {
    width: "100%",
    padding: "8px 0",
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#DBDBDB",
  },
  dividerText: {
    color: "#8E8E8E",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0 16px",
  },
  backButton: {
    width: "100%",
    padding: "8px 0",
    backgroundColor: "transparent",
    color: "#0095F6",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
  },
};

export default AdminLogin;