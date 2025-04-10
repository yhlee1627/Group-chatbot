import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function EvaluateTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filterSender, setFilterSender] = useState("");

  useEffect(() => {
    fetch(`${backend}/topics?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then(setTopics);

    fetch(`${backend}/rooms`, { headers })
      .then((res) => res.json())
      .then(setRooms);
  }, [classId]);

  const fetchMessages = async (room) => {
    setSelectedRoom(room);
    const res = await fetch(
      `${backend}/messages?room_id=eq.${room.room_id}&order=timestamp.asc`,
      { headers }
    );
    const data = await res.json();
    setMessages(data);
  };

  const updateRubric = async (topicId) => {
    const val = document.getElementById(`rubric-${topicId}`).value;
    await fetch(`${backend}/topics?topic_id=eq.${topicId}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ rubric_prompt: val }),
    });
    alert("✅ 루브릭 프롬프트 수정 완료!");
  };

  const senders = [...new Set(messages.map((m) => m.sender_id))];

  return (
    <div>
      <SectionTitle>채팅방 평가</SectionTitle>

      {topics.map((t) => (
        <div key={t.topic_id} style={styles.topicSection}>
          <h4 style={styles.topicTitle}>{t.title}</h4>

          <textarea
            id={`rubric-${t.topic_id}`}
            defaultValue={t.rubric_prompt}
            style={styles.textarea}
          />
          <button onClick={() => updateRubric(t.topic_id)} style={styles.buttonBlue}>
            루브릭 수정
          </button>

          <div style={styles.roomList}>
            {rooms
              .filter((r) => r.topic_id === t.topic_id)
              .map((r) => (
                <button
                  key={r.room_id}
                  onClick={() => fetchMessages(r)}
                  style={{
                    ...styles.roomButton,
                    backgroundColor: selectedRoom?.room_id === r.room_id ? "#e0f7fa" : "#f1f1f1",
                  }}
                >
                  {r.title}
                </button>
              ))}
          </div>
        </div>
      ))}

      {selectedRoom && (
        <div style={styles.chatBox}>
          <h4 style={styles.chatTitle}>💬 {selectedRoom.title}</h4>

          <div style={styles.filterRow}>
            <label>화자 필터:</label>
            <select
              value={filterSender}
              onChange={(e) => setFilterSender(e.target.value)}
              style={styles.select}
            >
              <option value="">전체</option>
              {senders.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.messageList}>
            {messages
              .filter((m) => !filterSender || m.sender_id === filterSender)
              .map((m, i) => (
                <div key={i} style={styles.messageItem}>
                  <strong>{m.sender_id}</strong>: {m.message}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  topicSection: {
    padding: "1rem",
    marginBottom: "2rem",
    borderBottom: "1px solid #ddd",
  },
  topicTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  textarea: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  buttonBlue: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  roomList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  roomButton: {
    padding: "0.4rem 0.8rem",
    border: "1px solid #bbb",
    borderRadius: "6px",
    cursor: "pointer",
  },
  chatBox: {
    padding: "1rem",
    backgroundColor: "#fafafa",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  chatTitle: {
    marginBottom: "1rem",
    fontSize: "1.1rem",
    fontWeight: "600",
  },
  filterRow: {
    marginBottom: "0.75rem",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  select: {
    padding: "0.3rem 0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  messageList: {
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    maxHeight: "300px",
    overflowY: "auto",
  },
  messageItem: {
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
  },
};

export default EvaluateTab;