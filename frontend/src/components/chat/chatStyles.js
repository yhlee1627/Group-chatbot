const styles = {
    chatHeader: {
      fontSize: "1.5rem",
      fontWeight: "600",
      marginBottom: "1rem",
      textAlign: "center",
      color: "#333",
      borderBottom: "2px solid #e0e0e0",
      paddingBottom: "0.5rem",
    },
  
    inputBoxContainer: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: "1rem",
      gap: "0.75rem",
    },
  
    inputField: {
      flexGrow: 1,
      padding: "0.75rem 1rem",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "15px",
      minWidth: "60%",
      outline: "none",
      transition: "border-color 0.3s",
    },
  
    sendButton: {
      padding: "0.75rem 1.2rem",
      borderRadius: "8px",
      background: "linear-gradient(135deg, #4A90E2, #007AFF)",
      color: "white",
      border: "none",
      fontSize: "15px",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
      transition: "background 0.3s",
    },
  
    sendButtonHover: {
      background: "linear-gradient(135deg, #357ABD, #0051D4)",
    },
  };
  
  export default styles;