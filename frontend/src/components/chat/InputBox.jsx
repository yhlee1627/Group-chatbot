import React from "react";
import { motion } from "framer-motion";

function InputBox({ input, setInput, onSend }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="메시지를 입력하세요..."
        style={styles.input}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        style={styles.sendButton}
        disabled={!input.trim()}
      >
        전송
      </motion.button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #DBDBDB",
    borderRadius: "22px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#FAFAFA",
    transition: "border-color 0.2s",
    ":focus": {
      borderColor: "#0095F6",
    },
  },
  sendButton: {
    padding: "8px 16px",
    backgroundColor: "#0095F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "22px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":disabled": {
      backgroundColor: "#B2DFFC",
      cursor: "not-allowed",
    },
  },
};

export default InputBox;