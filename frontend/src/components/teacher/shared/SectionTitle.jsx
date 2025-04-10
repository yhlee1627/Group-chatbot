// components/teacher/shared/SectionTitle.jsx
import React from "react";

function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontSize: "1.25rem",
      fontWeight: 600,
      marginBottom: "1rem",
      marginTop: "1.5rem",
      borderBottom: "2px solid #eee",
      paddingBottom: "0.5rem"
    }}>
      {children}
    </h3>
  );
}

export default SectionTitle;