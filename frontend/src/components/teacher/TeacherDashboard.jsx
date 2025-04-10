import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentTab from "./StudentTab";
import CreateTab from "./CreateTab";
import ManageTab from "./ManageTab";
import EvaluateTab from "./EvaluateTab";

function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const navigate = useNavigate();
  const classId = localStorage.getItem("classId");

  const backend = import.meta.env.VITE_BACKEND_URL;
  const headers = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/teacher-login");
  };

  const tabLabels = ["학생 관리", "채팅방 생성", "채팅방 관리", "채팅방 평가"];

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.6rem" }}>교사 대시보드</h2>
        <button onClick={handleLogout} style={logoutButtonStyle}>로그아웃</button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        {tabLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index + 1)}
            style={tabStyle(activeTab === index + 1)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 1 && <StudentTab backend={backend} headers={headers} classId={classId} />}
      {activeTab === 2 && <CreateTab backend={backend} headers={headers} classId={classId} />}
      {activeTab === 3 && <ManageTab backend={backend} headers={headers} classId={classId} />}
      {activeTab === 4 && <EvaluateTab backend={backend} headers={headers} classId={classId} />}
    </div>
  );
}

const tabStyle = (active) => ({
  padding: "0.5rem 1.2rem",
  backgroundColor: active ? "#1976d2" : "#eee",
  color: active ? "#fff" : "#333",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
});

const logoutButtonStyle = {
  backgroundColor: "#f44336",
  color: "#fff",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
};

export default TeacherDashboard;