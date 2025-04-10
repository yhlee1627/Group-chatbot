import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 추가
import ClassTab from "./ClassTab";
import StudentTab from "./StudentTab";
import TeacherTab from "./TeacherTab";
import RoomTab from "./RoomTab";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(1);
  const [classes, setClasses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const navigate = useNavigate(); // ✅ 추가

  const backend = import.meta.env.VITE_BACKEND_URL;
  const headers = {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchClasses();
    fetchTopics();
  }, []);

  const fetchData = async (table) => {
    try {
      const res = await fetch(`${backend}/${table}`, { headers });
      if (!res.ok) throw new Error(`${table} fetch failed`);
      return await res.json();
    } catch (err) {
      console.error(`❌ ${table} 불러오기 실패:`, err);
      return [];
    }
  };

  const fetchClasses = async () => {
    const data = await fetchData("classes");
    setClasses(data);
    if (!selectedClassId && data.length > 0) {
      setSelectedClassId(data[0].class_id);
    }
  };

  const fetchTopics = async () => {
    const data = await fetchData("topics");
    setTopics(data);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  const renderTabs = () => (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
      {["반 관리", "학생 계정 관리", "교사 계정 관리", "채팅방 관리"].map((label, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(index + 1)}
          style={activeTab === index + 1 ? styles.activeTab : styles.tab}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "960px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          관리자 대시보드
        </h2>
        <button onClick={handleLogout} style={styles.logoutButton}>로그아웃</button>
      </div>

      {renderTabs()}

      {activeTab === 1 && (
        <ClassTab
          classes={classes}
          backend={backend}
          headers={headers}
          reloadClasses={fetchClasses}
        />
      )}

      {activeTab === 2 && selectedClassId && (
        <StudentTab
          backend={backend}
          headers={headers}
          classes={classes}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
        />
      )}

      {activeTab === 3 && (
        <TeacherTab
          backend={backend}
          headers={headers}
          classes={classes}
        />
      )}

      {activeTab === 4 && selectedClassId && topics.length > 0 && (
        <RoomTab
          backend={backend}
          headers={headers}
          classes={classes}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          topics={topics}
        />
      )}
    </div>
  );
}

const styles = {
  tab: {
    backgroundColor: "#eee",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  activeTab: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  logoutButton: {
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default AdminDashboard;