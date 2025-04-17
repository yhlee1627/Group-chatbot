import React, { useState } from "react";

function CreateTab({ backend, headers, classId }) {
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(1);
  const [systemPrompt, setSystemPrompt] = useState("토론 도와주는 교사 역할");
  const [isCreating, setIsCreating] = useState(false);
  const [presets, setPresets] = useState([
    "토론 도와주는 교사 역할",
    "질문에 답변하는 전문가 역할",
    "학생들의 창의적 사고를 돕는 촉진자 역할"
  ]);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("주제를 입력해주세요.");
      return;
    }

    try {
      setIsCreating(true);
      
      const topicRes = await fetch(`${backend}/topics`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          title,
          class_id: classId,
          system_prompt: systemPrompt,
        }),
      });

      if (!topicRes.ok) {
        throw new Error("주제 생성에 실패했습니다.");
      }

      const topicData = await topicRes.json();
      const topicId = topicData?.[0]?.topic_id;

      if (!topicId) {
        throw new Error("주제 ID를 가져오는데 실패했습니다.");
      }

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

      const results = await Promise.all(requests);
      
      // 모든 요청이 성공했는지 확인
      const allSuccessful = results.every(res => res.ok);
      
      if (allSuccessful) {
        // 현재 프롬프트가 프리셋에 없으면 저장
        if (systemPrompt.trim() && !presets.includes(systemPrompt)) {
          setPresets([...presets, systemPrompt]);
        }
        
        alert("✅ 채팅방 생성 완료");
        setTitle("");
        setCount(1);
      } else {
        throw new Error("일부 채팅방 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("채팅방 생성 오류:", error);
      alert(`❌ 채팅방 생성 실패: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const selectPreset = (preset) => {
    setSystemPrompt(preset);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>새 채팅방 생성</h3>
      
      <div style={styles.card}>
        <div style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>주제</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="예: AI 윤리, 미래 기술, 기후 변화 등"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>채팅방 개수</label>
            <div style={styles.roomCounter}>
              <button 
                style={{
                  ...styles.roomCounterButton,
                  opacity: count <= 1 ? 0.5 : 1,
                }}
                onClick={() => setCount(Math.max(1, count - 1))}
                disabled={count <= 1}
              >
                -
              </button>
              <div style={styles.roomCountDisplay}>
                <div style={styles.roomCountValue}>{count}</div>
                <div style={styles.roomCountLabel}>개 조</div>
              </div>
              <button 
                style={styles.roomCounterButton}
                onClick={() => setCount(count + 1)}
              >
                +
              </button>
            </div>
            <div style={styles.roomCountDescription}>
              각 조별로 별도의 채팅방이 생성됩니다.
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>AI 보조교사 프롬프트</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={styles.textarea}
              placeholder="AI 역할을 입력하세요"
            />
            
            <div style={styles.presetContainer}>
              <p style={styles.presetTitle}>프롬프트 프리셋:</p>
              <div style={styles.presetList}>
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => selectPreset(preset)}
                    style={{
                      ...styles.presetButton,
                      backgroundColor: preset === systemPrompt ? '#E0F1FD' : 'transparent',
                      borderColor: preset === systemPrompt ? '#0095F6' : '#DBDBDB'
                    }}
                  >
                    {preset.length > 20 ? preset.substring(0, 20) + '...' : preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreate} 
            style={styles.button}
            disabled={isCreating || !title.trim()}
          >
            {isCreating ? '생성 중...' : '채팅방 생성하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#262626",
    marginBottom: "16px",
    borderBottom: "1px solid #DBDBDB",
    paddingBottom: "16px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    border: "1px solid #DBDBDB",
    padding: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#262626",
  },
  input: {
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    transition: "border-color 0.3s",
    ":focus": {
      borderColor: "#0095F6",
      outline: "none",
    },
  },
  roomCounter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "8px",
  },
  roomCounterButton: {
    width: "40px",
    height: "40px",
    fontSize: "20px",
    fontWeight: "600",
    border: "1px solid #DBDBDB",
    borderRadius: "50%",
    backgroundColor: "#FAFAFA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#0095F6",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#F5F5F5",
    },
  },
  roomCountDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    margin: "0 24px",
  },
  roomCountValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#262626",
  },
  roomCountLabel: {
    fontSize: "12px",
    color: "#8E8E8E",
  },
  roomCountDescription: {
    fontSize: "12px",
    color: "#8E8E8E",
    marginTop: "8px",
    textAlign: "center",
    fontStyle: "italic",
  },
  textarea: {
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #DBDBDB",
    borderRadius: "4px",
    backgroundColor: "#FAFAFA",
    minHeight: "120px",
    resize: "vertical",
    transition: "border-color 0.3s",
    ":focus": {
      borderColor: "#0095F6",
      outline: "none",
    },
  },
  presetContainer: {
    marginTop: "12px",
  },
  presetTitle: {
    fontSize: "12px",
    color: "#8E8E8E",
    fontWeight: "600",
    marginBottom: "8px",
  },
  presetList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  presetButton: {
    padding: "6px 12px",
    fontSize: "12px",
    borderRadius: "16px",
    border: "1px solid #DBDBDB",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      borderColor: "#0095F6",
    },
  },
  button: {
    marginTop: "12px",
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    padding: "12px",
    borderRadius: "4px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s",
    ":hover": {
      backgroundColor: "#1877F2",
    },
    ":disabled": {
      backgroundColor: "#B2DFFC",
      cursor: "not-allowed",
    },
  },
};

export default CreateTab;