import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [rooms, setRooms] = useState([]);
  const [topics, setTopics] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword1, setEditPassword1] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [activeTab, setActiveTab] = useState("name");

  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId");
  const classId = localStorage.getItem("classId");

  useEffect(() => {
    if (!studentId || !classId) {
      navigate("/student-login");
      return;
    }

    const fetchData = async () => {
      try {
        const roomRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/rooms`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        const topicRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/topics`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!roomRes.ok || !topicRes.ok) {
          throw new Error("Supabase fetch failed");
        }

        const roomData = await roomRes.json();
        const topicData = await topicRes.json();

        const topicMap = {};
        topicData.forEach((t) => {
          topicMap[t.topic_id] = {
            title: t.title,
            class_id: t.class_id,
          };
        });

        const filteredRooms = roomData.filter((room) => {
          const topic = topicMap[room.topic_id];
          return topic?.class_id === classId;
        });

        setTopics(topicMap);
        setRooms(filteredRooms);
      } catch (err) {
        console.error("❌ 채팅방 데이터를 불러오지 못했습니다:", err);
        setRooms([]);
      }
    };

    fetchData();
  }, []);

  const updateStudentInfo = async (name, password) => {
    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = password;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/students?student_id=eq.${encodeURIComponent(studentId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    const result = await res.json();
    console.log("📡 Supabase 응답 상태:", res.status, result);

    if (res.ok) {
      alert("정보가 수정되었습니다!");
      setShowSidebar(false);
    } else {
      alert("수정 실패 😢");
    }
  };

  const openSidebar = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/students?student_id=eq.${encodeURIComponent(studentId)}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await res.json();
      const name = data?.[0]?.name || studentId;
      setCurrentName(name);
      setEditName(name);
      setEditPassword1("");
      setEditPassword2("");
      setActiveTab("name");
      setShowSidebar(true); // ✅ 사이드바 열기
    } catch (err) {
      console.error("❌ 학생 정보 불러오기 실패:", err);
      alert("내 정보 불러오기에 실패했습니다.");
    }
  };

  const handleNameSave = () => {
    if (!editName) {
      alert("이름을 입력해주세요.");
      return;
    }
    updateStudentInfo(editName, null);
  };

  const handlePasswordSave = () => {
    if (!editPassword1 || !editPassword2) {
      alert("비밀번호를 모두 입력해주세요.");
      return;
    }
    if (editPassword1 !== editPassword2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    updateStudentInfo(null, editPassword1);
  };

  const handleEnterRoom = (roomId) => {
    localStorage.setItem("roomId", roomId);
    navigate("/chat");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/student-login");
  };

  const grouped = {};
  rooms.forEach((room) => {
    const tid = room.topic_id;
    if (!grouped[tid]) grouped[tid] = [];
    grouped[tid].push(room);
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 600 }}>참여 가능한 채팅방</h2>
        <div>
          <button onClick={openSidebar} style={buttonStyleBlue}>내 정보 수정</button>
          <button onClick={handleLogout} style={buttonStyleRed}>로그아웃</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#777" }}>
          참여 가능한 채팅방이 없습니다.
        </div>
      ) : (
        Object.entries(grouped).map(([topicId, roomList]) => (
          <div key={topicId} style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 500, marginBottom: "0.75rem" }}>
              주제: {topics[topicId]?.title || "제목 없음"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {roomList.map((room) => (
                <div key={room.room_id} style={roomCardStyle}>
                  <span style={{ fontSize: "1rem", fontWeight: 500 }}>{room.title}</span>
                  <button onClick={() => handleEnterRoom(room.room_id)} style={buttonStyleGreen}>
                    참여하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ✅ 모던 사이드바 */}
      {showSidebar && (
        <>
          <div style={overlayStyle} onClick={() => setShowSidebar(false)} />
          <div style={sidebarStyle}>
            <h3 style={{ marginBottom: "1rem" }}>내 정보 수정</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label>이름</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleNameSave} style={buttonStyleGreen}>이름 저장</button>
            </div>

            <div>
              <label>비밀번호</label>
              <input
                type="password"
                placeholder="새 비밀번호"
                value={editPassword1}
                onChange={(e) => setEditPassword1(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={editPassword2}
                onChange={(e) => setEditPassword2(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handlePasswordSave} style={buttonStyleGreen}>비밀번호 저장</button>
            </div>

            <button onClick={() => setShowSidebar(false)} style={{ ...buttonStyleRed, marginTop: "1.5rem" }}>
              닫기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 🔵 스타일 정의
const buttonStyleBlue = {
  marginRight: "0.75rem",
  backgroundColor: "#1976d2",
  color: "#fff",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
};

const buttonStyleRed = {
  backgroundColor: "#f44336",
  color: "#fff",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
};

const buttonStyleGreen = {
  marginTop: "0.5rem",
  backgroundColor: "#2e7d32",
  color: "white",
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "6px",
  cursor: "pointer",
};

const roomCardStyle = {
  padding: "1rem",
  border: "1px solid #ddd",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#fff",
};

const sidebarStyle = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "300px",
  height: "100%",
  backgroundColor: "#ffffff",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  padding: "1.5rem",
  zIndex: 2000,
  display: "flex",
  flexDirection: "column",
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  zIndex: 1999,
};

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  marginTop: "0.25rem",
  marginBottom: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

export default StudentDashboard;