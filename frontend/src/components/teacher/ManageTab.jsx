import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function ManageTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch(`${backend}/topics?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then(setTopics);

    fetch(`${backend}/rooms`, { headers })
      .then((res) => res.json())
      .then(setRooms);
  }, [classId]);

  const updatePrompt = async (topicId) => {
    const newPrompt = document.getElementById(`prompt-${topicId}`).value;
    await fetch(`${backend}/topics?topic_id=eq.${topicId}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ system_prompt: newPrompt }),
    });
    alert("✅ 시스템 프롬프트 수정 완료!");
  };

  const deleteRoom = async (roomId) => {
    await fetch(`${backend}/messages?room_id=eq.${roomId}`, { method: "DELETE", headers });
    await fetch(`${backend}/rooms?room_id=eq.${roomId}`, { method: "DELETE", headers });
    alert("✅ 채팅방 삭제 완료!");
    location.reload();
  };

  return (
    <div>
      <SectionTitle>채팅방 관리</SectionTitle>
      {topics.map((t) => (
        <div key={t.topic_id} style={styles.topicBox}>
          <h4>{t.title}</h4>
          <textarea
            id={`prompt-${t.topic_id}`}
            defaultValue={t.system_prompt}
            style={styles.textarea}
          />
          <button onClick={() => updatePrompt(t.topic_id)} style={styles.button}>시스템 프롬프트 수정</button>

          <ul>
            {rooms.filter((r) => r.topic_id === t.topic_id).map((r) => (
              <li key={r.room_id}>
                {r.title} <button onClick={() => deleteRoom(r.room_id)} style={styles.deleteBtn}>삭제</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const styles = {
  topicBox: {
    padding: "1rem",
    borderBottom: "1px solid #ddd",
    marginBottom: "2rem",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  deleteBtn: {
    color: "#c00",
    border: "none",
    background: "none",
    cursor: "pointer",
  },
};

export default ManageTab;