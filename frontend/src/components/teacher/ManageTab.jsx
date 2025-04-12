import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function ManageTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);

  // 방 목록 가져오기 함수 분리
  const fetchRooms = async () => {
    const res = await fetch(`${backend}/rooms`, { headers });
    const data = await res.json();
    setRooms(data);
  };

  useEffect(() => {
    fetch(`${backend}/topics?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then(setTopics);

    fetchRooms();
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
    await fetchRooms();  // ✅ 방 목록 다시 불러오기
  };

  // 주어진 topic에 연결된 채팅방이 있는지 확인
  const hasRooms = (topicId) => {
    return rooms.some((room) => room.topic_id === topicId);
  };

  return (
    <div>
      <SectionTitle>채팅방 관리</SectionTitle>
      {topics
        .filter((t) => hasRooms(t.topic_id))  // ✅ 연결된 방이 있을 때만 렌더링
        .map((t) => (
          <div key={t.topic_id} style={styles.topicBox}>
            <h4>{t.title}</h4>
            <textarea
              id={`prompt-${t.topic_id}`}
              defaultValue={t.system_prompt}
              style={styles.textarea}
            />
            <button onClick={() => updatePrompt(t.topic_id)} style={styles.button}>
              시스템 프롬프트 수정
            </button>

            <ul>
              {rooms
                .filter((r) => r.topic_id === t.topic_id)
                .map((r) => (
                  <li key={r.room_id}>
                    {r.title}
                    <button onClick={() => deleteRoom(r.room_id)} style={styles.deleteBtn}>
                      삭제
                    </button>
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
    marginLeft: "0.5rem",
  },
};

export default ManageTab;