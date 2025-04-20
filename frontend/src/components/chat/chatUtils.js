import theme from "../../styles/theme";

// 이전 색상 배열은 더 이상 사용하지 않음
// const userColors = ["#1f77b4", "#2ca02c", "#d62728", "#9467bd", "#ff7f0e", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

export const getUserColor = (sender_id) => {
  if (sender_id === "gpt") {
    return "#0073E6"; // GPT 메시지는 파란색 계열
  }
  // 일반 사용자 메시지는 테마 색상 사용
  return theme.NEUTRAL_TEXT;
};

/**
 * 간단한 타임스탬프 처리 함수
 * - 모든 시간은 Date 객체로 변환하여 사용
 * - 브라우저의 기본 시간대 변환 기능 활용
 */
const processTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  
  // 어떤 형식이든 일관되게 Date 객체로 변환
  return new Date(timestamp);
};

// 타임스탬프를 시:분 형식으로 포맷팅
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  
  return date.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false // 24시간제 사용
  });
};

// 날짜 형식화 - YYYY-MM-DD
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
};

// 간단한 날짜 형식화 - MM-DD
export const formatShortDate = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
};

// 날짜와 시간 함께 표시 - MM-DD HH:MM
export const formatDatetime = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
  
  const timeStr = date.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false
  });
  
  return `${dateStr} ${timeStr}`;
};