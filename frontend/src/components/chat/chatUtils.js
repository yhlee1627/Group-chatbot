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

// UTC 시간을 KST로 변환하는 헬퍼 함수
const convertToKST = (timestamp) => {
  if (!timestamp) return null;
  
  const date = new Date(timestamp);
  // UTC 시간을 KST로 변환 (UTC+9)
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
};

// 타임스탬프를 특정 형식으로 포맷팅 (시:분)
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  
  const kstDate = convertToKST(timestamp);
  return kstDate.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false // 24시간제 사용
  });
};

// 날짜 형식화 - YYYY-MM-DD
export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  
  const kstDate = convertToKST(timestamp);
  return kstDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
};

// 간단한 날짜 형식화 - MM-DD
export const formatShortDate = (timestamp) => {
  if (!timestamp) return "";
  
  const kstDate = convertToKST(timestamp);
  return kstDate.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
};

// 날짜와 시간 함께 표시 - MM-DD HH:MM
export const formatDatetime = (timestamp) => {
  if (!timestamp) return "";
  
  const kstDate = convertToKST(timestamp);
  const dateStr = kstDate.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
  
  const timeStr = kstDate.toLocaleTimeString('ko-KR', { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false
  });
  
  return `${dateStr} ${timeStr}`;
};