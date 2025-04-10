import React from "react";
import styles from "./chatStyles";

function InputBox({ input, setInput, onSend }) {
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");           // ✅ 먼저 입력창 초기화
    onSend(trimmed);        // ✅ 그 후 메시지 전송
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.inputBoxContainer}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyUp={handleKeyUp}    // ✅ 변경: onKeyDown → onKeyUp
        placeholder="메시지를 입력하세요..."
        style={styles.inputField}
      />
      <button onClick={handleSend} style={styles.sendButton}>
        보내기
      </button>
    </div>
  );
}

export default InputBox;