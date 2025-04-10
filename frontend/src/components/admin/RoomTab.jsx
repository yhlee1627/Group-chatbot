import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";
import ClassDropdown from "./shared/ClassDropdown";

function RoomTab({ backend, headers, classes, selectedClassId, setSelectedClassId, topics }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (selectedClassId && topics.length > 0) fetchRoomsByClass();
  }, [selectedClassId, topics]);

  const fetchRoomsByClass = async () => {
    const topicIds = topics
      .filter((t) => t.class_id === selectedClassId)
      .map((t) => `topic_id.eq.${t.topic_id}`);

    if (topicIds.length === 0) {
      setRooms([]);
      return;
    }

    const filter = topicIds.join(",");
    try {
      const res = await fetch(`${backend}/rooms?or=(${filter})`, { headers });
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("❌ rooms 응답이 배열이 아님:", data);
        setRooms([]);
        return;
      }

      setRooms(data);
    } catch (err) {
      console.error("❌ 채팅방 불러오기 오류:", err);
      setRooms([]);
    }
  };

  const deleteRoom = async (roomId) => {
    const res = await fetch(`${backend}/rooms?room_id=eq.${roomId}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) fetchRoomsByClass();
    else alert("채팅방 삭제 실패");
  };

  return (
    <div>
      <SectionTitle>채팅방 관리</SectionTitle>

      <ClassDropdown
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
      />

      {rooms.length === 0 ? (
        <div style={styles.empty}>채팅방이 없습니다.</div>
      ) : (
        rooms.map((room, i) => (
          <div key={i} style={styles.roomCard}>
            <span>{room.title}</span>
            <button onClick={() => deleteRoom(room.room_id)} style={styles.deleteBtn}>
              삭제
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  roomCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    marginBottom: "0.5rem",
    backgroundColor: "#fff",
  },
  deleteBtn: {
    color: "#c00",
    border: "none",
    background: "none",
    cursor: "pointer",
  },
  empty: {
    padding: "1rem",
    color: "#999",
  },
};

export default RoomTab;