import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import theme from "../../styles/theme";

function InputBox({ input, setInput, onSend }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setWindowWidth(window.innerWidth);
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

  // 모바일 환경에서 폼 스타일 조정
  const formStyle = {
    ...styles.form,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxSizing: 'border-box'
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div 
        style={{
          ...styles.inputWrapper,
          ...(isFocused ? styles.inputWrapperFocused : {}),
          ...(isHovered && !isFocused ? styles.inputWrapperHover : {}),
          flex: 1,
          minHeight: isMobile ? '38px' : '46px',
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="메시지를 입력하세요..."
          style={{
            ...styles.input,
            width: '100%',
            fontSize: isMobile ? '14px' : '15px',
            padding: isMobile ? '8px 14px' : '12px 18px'
          }}
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        style={{
          ...styles.sendButton,
          minWidth: isMobile ? '40px' : '64px',
          height: isMobile ? '38px' : '46px',
          padding: isMobile ? '8px' : '12px 18px',
          flexShrink: 0
        }}
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
    display: "flex", // flexbox 추가
    alignItems: "center" // 세로 중앙 정렬
  },
  inputWrapperHover: {
    border: `1px solid ${theme.NEUTRAL_DARK_BORDER}`,
    backgroundColor: "#FCFCFD",
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
    lineHeight: "1.2",
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