import React, { useEffect, useState } from "react";

function TopicCreateForm() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [title, setTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [rubricPrompt, setRubricPrompt] = useState("");
  const [roomCount, setRoomCount] = useState(3);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/classes`)
      .then((res) => res.json())
      .then(setClasses);
  }, []);

  const handleSubmit = async () => {
    if (!selectedClassId || !title || !systemPrompt || !rubricPrompt || roomCount < 1) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const payload = {
      class_id: selectedClassId,
      title,
      system_prompt: systemPrompt,
      rubric_prompt: rubricPrompt,
      room_count: roomCount,
    };

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ 주제 및 방 생성 완료!");
      setTitle("");
      setSystemPrompt("");
      setRubricPrompt("");
    } else {
      alert("❌ 생성 실패");
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto" }}>
      <h3>📚 반별 주제 등록 및 방 생성</h3>

      <label>🏫 학급 선택</label>
      <select
        value={selectedClassId}
        onChange={(e) => setSelectedClassId(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem" }}
      >
        <option value="">-- 반을 선택하세요 --</option>
        {classes.map((cls) => (
          <option key={cls.class_id} value={cls.class_id}>
            {cls.name}
          </option>
        ))}
      </select>

      <label>📘 주제명</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: AI 윤리"
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <label>🔢 생성할 방 개수</label>
      <input
        type="number"
        value={roomCount}
        min={1}
        onChange={(e) => setRoomCount(Number(e.target.value))}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <label>🤖 GPT 프롬프트</label>
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={4}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <label>📋 평가 루브릭</label>
      <textarea
        value={rubricPrompt}
        onChange={(e) => setRubricPrompt(e.target.value)}
        rows={4}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button onClick={handleSubmit} style={{ width: "100%" }}>
        ✅ 주제 및 채팅방 생성
      </button>
    </div>
  );
}

export default TopicCreateForm;