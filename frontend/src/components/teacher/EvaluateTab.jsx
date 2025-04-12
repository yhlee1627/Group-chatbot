import React, { useEffect, useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function EvaluateTab({ backend, headers, classId }) {
  const [topics, setTopics] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filterSender, setFilterSender] = useState("");
  const [targetStudent, setTargetStudent] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const evaluateApi = import.meta.env.VITE_EVALUATE_API;

  useEffect(() => {
    fetch(`${backend}/topics?class_id=eq.${classId}`, { headers })
      .then((res) => res.json())
      .then(setTopics);

    fetch(`${backend}/rooms`, { headers })
      .then((res) => res.json())
      .then(setRooms);
  }, [classId]);

  useEffect(() => {
    if (selectedRoom) fetchMessages(selectedRoom);
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) fetchEvaluation();
  }, [selectedRoom, targetStudent]);

  const fetchMessages = async (room) => {
    const res = await fetch(
      `${backend}/messages?room_id=eq.${room.room_id}&order=timestamp.asc`,
      { headers }
    );
    const data = await res.json();
    setMessages(data);
  };

  const fetchEvaluation = async () => {
    if (!selectedRoom) return;
  
    const studentParam = targetStudent
      ? `&student_id=eq.${targetStudent}`
      : `&student_id=is.null`;
  
    const url = `${supabaseUrl}/gpt_chat_evaluations?room_id=eq.${selectedRoom.room_id}${studentParam}&order=created_at.desc&limit=1`;
    console.log("📡 Supabase 평가 조회 주소:", url);
    try {
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
  
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ 평가 결과 조회 실패:", res.status, text);
        setEvaluation("");
        return;
      }
  
      const data = await res.json();
      setEvaluation(data[0]?.summary || "");
    } catch (err) {
      console.error("❌ 평가 결과 조회 실패 (예외):", err);
      setEvaluation("");
    }
  };

  const evaluateWithGPT = async () => {
    if (!selectedRoom) return;

    const topic = topics.find((t) => t.topic_id === selectedRoom.topic_id);
    if (!topic?.rubric_prompt) {
      alert("⚠️ 해당 토픽에 루브릭 프롬프트가 없습니다.");
      return;
    }

    setIsEvaluating(true);
    setEvaluation("GPT가 평가 중입니다...");

    try {
      const filteredMessages = !targetStudent
        ? messages
        : messages.filter((m) => m.sender_id === targetStudent);

      const res = await fetch(`${evaluateApi}/evaluate-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic_id: topic.topic_id,
          rubric_prompt: topic.rubric_prompt,
          room_id: selectedRoom.room_id,
          class_id: topic.class_id,
          target_student: targetStudent || null,
          messages: filteredMessages.map((m) => ({
            sender_id: m.sender_id,
            message: m.message,
          })),
        }),
      });

      const raw = await res.text();
      const result = JSON.parse(raw);
      setEvaluation(result.feedback || "📭 GPT 평가 결과 없음");
    } catch (error) {
      console.error("GPT 평가 오류:", error);
      setEvaluation("❌ GPT 평가 요청 중 오류가 발생했습니다.");
    }

    setIsEvaluating(false);
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
                  onClick={() => setSelectedRoom(r)}
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

          {/* 화자 필터 */}
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

          {/* 메시지 출력 */}
          <div style={styles.messageList}>
            {messages
              .filter((m) => !filterSender || m.sender_id === filterSender)
              .map((m, i) => (
                <div key={i} style={styles.messageItem}>
                  <strong>{m.sender_id}</strong>: {m.message}
                </div>
              ))}
          </div>

          {/* 평가 대상 + 버튼 */}
          <div style={styles.filterRow}>
            <label>평가 대상:</label>
            <select
              value={targetStudent}
              onChange={(e) => setTargetStudent(e.target.value)}
              style={styles.select}
            >
              <option value="">전체 학생</option>
              {senders.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={evaluateWithGPT}
              disabled={isEvaluating}
              style={styles.buttonBlue}
            >
              {isEvaluating
                ? "GPT 평가 중..."
                : `💡 GPT로 평가하기 (${targetStudent || "전체"})`}
            </button>
          </div>

          {/* 평가 결과 */}
          {evaluation ? (
            <div style={styles.evaluationBox}>
              <h5>📊 GPT 평가 결과</h5>
              <pre style={{ whiteSpace: "pre-wrap" }}>{evaluation}</pre>
            </div>
          ) : (
            !isEvaluating && (
              <div style={{ marginTop: "1rem", fontStyle: "italic", color: "#999" }}>
                📭 평가 결과가 없습니다.
              </div>
            )
          )}
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
    marginTop: "0.25rem",
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
    marginBottom: "1rem",
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
    marginBottom: "1rem",
  },
  messageItem: {
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
  },
  evaluationBox: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
    lineHeight: "1.5",
  },
};

export default EvaluateTab;