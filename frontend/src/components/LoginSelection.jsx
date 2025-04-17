import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.card}
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          style={styles.logoContainer}
        >
          <div style={styles.logo}>💬</div>
          <h1 style={styles.title}>학생 채팅</h1>
        </motion.div>

        <p style={styles.subtitle}>
          로그인을 통해 실시간 채팅에 참여하세요
        </p>

        <div style={styles.buttonContainer}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/student-login")}
            style={styles.primaryButton}
          >
            학생으로 로그인
          </motion.button>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>또는</span>
            <span style={styles.dividerLine}></span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/teacher-login")}
            style={styles.secondaryButton}
          >
            교사로 로그인
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin-login")}
            style={styles.secondaryButton}
          >
            관리자로 로그인
          </motion.button>
        </div>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>© Youngho Lee, yhlee@dnue.ac.kr</p>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FAFAFA",
    padding: "1rem",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    maxWidth: "350px",
    width: "100%",
    padding: "40px",
    backgroundColor: "#FFFFFF",
    borderRadius: "1px",
    border: "1px solid #DBDBDB",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoContainer: {
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
    color: "#262626",
    margin: "0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#8E8E8E",
    marginBottom: "24px",
    padding: "0 12px",
    lineHeight: "1.4",
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  primaryButton: {
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
  secondaryButton: {
    width: "100%",
    padding: "8px 0",
    backgroundColor: "transparent",
    color: "#0095F6",
    border: "1px solid #0095F6",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0 16px",
    width: "100%",
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
  footer: {
    marginTop: "40px",
    width: "100%",
  },
  footerText: {
    fontSize: "12px",
    color: "#8E8E8E",
    margin: "0",
  },
};

export default LoginSelection;