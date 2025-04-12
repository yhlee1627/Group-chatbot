import React, { useState } from "react";
import styles from "./chatStyles";

function InputBox({ input, setInput, onSend }) {
  const [isGPT, setIsGPT] = useState(false);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput(""); // 먼저 비우기
    onSend(trimmed, isGPT);
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.inputBoxContainer}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={isGPT}
          onChange={(e) => setIsGPT(e.target.checked)}
          style={styles.checkbox}
        />
        GPT에게 질문
      </label>

      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="메시지를 입력하세요..."
          style={styles.inputField}
        />
        <button onClick={handleSend} style={styles.sendButton}>전송</button>
      </div>
    </div>
  );
}

export default InputBox;