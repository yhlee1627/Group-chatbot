import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ❌ StrictMode 제거 → useEffect 중복 방지
ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);