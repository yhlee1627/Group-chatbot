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
 * 타임스탬프 처리 함수
 * - ISO 문자열이나 Date 객체를 일관된 로컬 시간으로 변환
 * - 모든 시간은 한국 시간대(KST)로 표시
 */
const processTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  
  const date = new Date(timestamp);
  
  // ISO 문자열에 'Z'가 포함되어 있으면 UTC 시간이므로
  // 브라우저의 기본 date 변환이 자동으로 로컬 시간대(KST)로 변환함
  return date;
};

/**
 * 타임스탬프를 시:분 형식으로 포맷팅
 * 항상 한국 시간(KST)으로 표시
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  
  return date.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false, // 24시간제 사용
    timeZone: 'Asia/Seoul' // 명시적으로 한국 시간대 설정
  });
};

/**
 * 날짜 형식화 - YYYY-MM-DD
 * 항상 한국 시간(KST)으로 표시
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul' // 명시적으로 한국 시간대 설정
  }).replace(/\. /g, '-').replace('.', '');
};

/**
 * 간단한 날짜 형식화 - MM-DD
 * 항상 한국 시간(KST)으로 표시
 */
export const formatShortDate = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul' // 명시적으로 한국 시간대 설정
  }).replace(/\. /g, '-').replace('.', '');
};

/**
 * 날짜와 시간 함께 표시 - MM-DD HH:MM
 * 항상 한국 시간(KST)으로 표시
 */
export const formatDatetime = (timestamp) => {
  if (!timestamp) return "";
  
  const date = processTimestamp(timestamp);
  const dateStr = date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul' // 명시적으로 한국 시간대 설정
  }).replace(/\. /g, '-').replace('.', '');
  
  const timeStr = date.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false,
    timeZone: 'Asia/Seoul' // 명시적으로 한국 시간대 설정
  });
  
  return `${dateStr} ${timeStr}`;
};