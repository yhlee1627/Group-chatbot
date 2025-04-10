import React, { useState } from "react";
import SectionTitle from "./shared/SectionTitle";

function CreateTab({ backend, headers, classId }) {
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(1);
  const [systemPrompt, setSystemPrompt] = useState("토론 도와주는 교사 역할");

  const handleCreate = async () => {
    const topicRes = await fetch(`${backend}/topics`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        title,
        class_id: classId,
        system_prompt: systemPrompt,
      }),
    });

    const topicData = await topicRes.json();
    const topicId = topicData?.[0]?.topic_id;

    const requests = Array.from({ length: count }, (_, i) =>
      fetch(`${backend}/rooms`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          topic_id: topicId,
          title: `${title} - 조 ${i + 1}`,
        }),
      })
    );

    await Promise.all(requests);
    alert("✅ 채팅방 생성 완료");
    setTitle("");
    setCount(1);
    setSystemPrompt("역할에 대해 자세히 작성하세요");
  };

  return (
    <div>
      <SectionTitle>채팅방 생성</SectionTitle>
      <div style={styles.form}>
        <label style={styles.label}>주제</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
          placeholder="예: AI 윤리"
        />

        <label style={styles.label}>채팅방 개수</label>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          style={styles.input}
        />

        <label style={styles.label}>AI 보조교사 프롬프트</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          style={styles.textarea}
          placeholder="AI 역할을 입력하세요"
        />

        <button onClick={handleCreate} style={styles.button}>생성</button>
      </div>
    </div>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: "600px",
    marginTop: "1rem",
  },
  label: {
    fontWeight: "500",
    marginBottom: "0.25rem",
    fontSize: "1rem",
    color: "#333",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  textarea: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    minHeight: "100px",
  },
  button: {
    marginTop: "1rem",
    backgroundColor: "#1976d2",
    color: "white",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default CreateTab;