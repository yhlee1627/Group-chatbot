// 메인 색상 및 테마 정의
const theme = {
  // 메인 색상
  MAIN_COLOR: "rgb(130, 124, 209)",
  MAIN_DARK: "rgb(117, 111, 189)",
  MAIN_LIGHT: "rgba(130, 124, 209, 0.1)",
  MAIN_HOVER: "rgb(117, 111, 189)",
  
  // 중립 색상
  NEUTRAL_TEXT: "#333333",
  NEUTRAL_LIGHT_TEXT: "#666666",
  NEUTRAL_PLACEHOLDER: "#8E8E8E",
  NEUTRAL_BORDER: "#DBDBDB",
  NEUTRAL_BACKGROUND: "#FAFAFA",
  
  // 상태 색상
  SUCCESS: "#34D399",
  WARNING: "#FBBF24",
  ERROR: "#EF4444",
  INFO: "rgb(130, 124, 209)",
  
  // 그림자 효과
  SHADOW_SM: "0 1px 2px rgba(0, 0, 0, 0.05)",
  SHADOW_MD: "0 4px 6px rgba(130, 124, 209, 0.1)",
  SHADOW_LG: "0 10px 15px rgba(130, 124, 209, 0.1)",
  
  // 라운드 설정
  ROUNDED_SM: "4px",
  ROUNDED_MD: "8px",
  ROUNDED_LG: "12px",
  ROUNDED_FULL: "9999px",
  
  // 공통 버튼 스타일
  buttonPrimary: {
    backgroundColor: "rgb(130, 124, 209)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "rgb(117, 111, 189)"
    }
  },
  
  buttonSecondary: {
    backgroundColor: "transparent",
    color: "rgb(130, 124, 209)",
    border: "1px solid rgb(130, 124, 209)",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "rgba(130, 124, 209, 0.1)",
      color: "rgb(117, 111, 189)"
    }
  },
  
  // 카드 스타일
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(130, 124, 209, 0.15)",
    border: "1px solid rgba(130, 124, 209, 0.2)",
  },
};

export default theme; 