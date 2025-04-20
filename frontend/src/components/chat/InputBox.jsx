import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import theme from "../../styles/theme";

function InputBox({ input, setInput, onSend }) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={{
        ...styles.inputWrapper,
        ...(isFocused ? styles.inputWrapperFocused : {})
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="메시지를 입력하세요..."
          style={styles.input}
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        style={styles.sendButton}
        disabled={!input.trim()}
      >
        {isMobile ? (
          <SendIcon />
        ) : (
          <span style={styles.buttonText}>보내기</span>
        )}
      </motion.button>
    </form>
  );
}

// 전송 아이콘 컴포넌트
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M21.7 2.3C21.5 2.1 21.2 2 21 2C20.9 2 20.7 2 20.6 2.1L2.6 9.1C2.3 9.2 2.1 9.5 2 9.8C2 10.1 2.1 10.4 2.3 10.6L6.4 14.7L17 7L9.3 17.6L13.4 21.7C13.6 21.9 13.8 22 14.1 22C14.1 22 14.1 22 14.2 22C14.5 21.9 14.7 21.7 14.9 21.4L21.9 3.4C22 3.2 22 2.7 21.7 2.3Z" 
      fill="currentColor"
    />
  </svg>
);

const styles = {
  form: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    width: "100%",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: "24px",
    backgroundColor: "#F9F9FB",
    padding: "2px",
    border: `1px solid ${theme.NEUTRAL_BORDER}`,
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05) inset",
  },
  inputWrapperFocused: {
    border: `1px solid ${theme.MAIN_COLOR}`,
    boxShadow: `0 0 0 2px ${theme.MAIN_LIGHT}`,
    backgroundColor: "#FFFFFF",
  },
  input: {
    width: "100%",
    padding: "12px 18px",
    fontSize: "15px",
    outline: "none",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "24px",
    color: theme.NEUTRAL_TEXT,
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    backgroundColor: theme.MAIN_COLOR,
    color: "#FFFFFF",
    border: "none",
    borderRadius: "24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(130, 124, 209, 0.2)",
    minWidth: "64px",
    height: "46px",
    ":hover": {
      backgroundColor: theme.MAIN_DARK,
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(130, 124, 209, 0.3)",
    },
    ":active": {
      transform: "translateY(0)",
      boxShadow: "0 1px 2px rgba(130, 124, 209, 0.2)",
    },
    ":disabled": {
      backgroundColor: "rgba(130, 124, 209, 0.4)",
      cursor: "not-allowed",
      boxShadow: "none",
    },
  },
  buttonText: {
    marginLeft: "4px",
  },
};

export default InputBox;