const userColors = ["#1f77b4", "#2ca02c", "#d62728", "#9467bd", "#ff7f0e", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

export const getUserColor = (sender_id) => {
  if (!sender_id) return "#888";
  let hash = 0;
  for (let i = 0; i < sender_id.length; i++) {
    hash = sender_id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return userColors[Math.abs(hash) % userColors.length];
};