import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css"; // 선택: 스타일 파일 있으면 사용

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);