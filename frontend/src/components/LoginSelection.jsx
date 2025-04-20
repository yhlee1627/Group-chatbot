import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// 메인 색상 상수 정의
const MAIN_COLOR = "rgb(130, 124, 209)";
const LIGHT_MAIN_COLOR = "rgba(130, 124, 209, 0.1)";
const TRANSPARENT_COLOR = "rgba(255, 255, 255, 0)";
const HOVER_COLOR = "rgb(117, 111, 189)";

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
          <img 
            src="/images/berry-icon.png" 
            alt="BerryChat Logo" 
            style={styles.logoImage} 
            onError={(e) => {
              // 이미지 로드 실패 시 이모지 폴백
              e.target.style.display = 'none';
              document.getElementById('fallbackLogo').style.display = 'block';
            }}
          />
          <div id="fallbackLogo" style={{...styles.logo, display: 'none'}}>🫐</div>
          <h1 style={styles.title}>Berrytalk</h1>
        </motion.div>

        <p style={styles.subtitle}>
          혼자보다 함께, 더 나은 대화
        </p>

        <div style={styles.buttonContainer}>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: HOVER_COLOR }}
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
            whileHover={{ scale: 1.02, backgroundColor: LIGHT_MAIN_COLOR, color: HOVER_COLOR }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/teacher-login")}
            style={{...styles.secondaryButton, backgroundColor: TRANSPARENT_COLOR}}
          >
            교사로 로그인
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: LIGHT_MAIN_COLOR, color: HOVER_COLOR }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin-login")}
            style={{...styles.secondaryButton, backgroundColor: TRANSPARENT_COLOR}}
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
    background: LIGHT_MAIN_COLOR,
    padding: "1rem",
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    maxWidth: "350px",
    width: "100%",
    padding: "40px",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(130, 124, 209, 0.15)",
    border: "1px solid rgba(130, 124, 209, 0.2)",
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
  logoImage: {
    width: "64px",
    height: "64px",
    marginBottom: "12px",
    objectFit: "contain",
  },
  logo: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: MAIN_COLOR,
    margin: "0",
  },
  subtitle: {
    fontSize: "15px",
    color: "#666",
    marginBottom: "28px",
    padding: "0 12px",
    lineHeight: "1.4",
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 0",
    backgroundColor: MAIN_COLOR,
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "background-color 0.2s ease",
  },
  secondaryButton: {
    width: "100%",
    padding: "12px 0",
    color: MAIN_COLOR,
    border: `1px solid ${MAIN_COLOR}`,
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
    backgroundColor: "rgba(130, 124, 209, 0.3)",
  },
  dividerText: {
    color: "#888",
    fontSize: "13px",
    fontWeight: "500",
    margin: "0 16px",
  },
  footer: {
    marginTop: "40px",
    width: "100%",
  },
  footerText: {
    fontSize: "12px",
    color: "#888",
    margin: "0",
  },
};

export default LoginSelection;