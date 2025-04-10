import React from "react";

function ClassDropdown({ classes, selectedClassId, setSelectedClassId }) {
  return (
    <select
      value={selectedClassId}
      onChange={(e) => setSelectedClassId(e.target.value)}
      style={{
        padding: "0.5rem",
        borderRadius: "6px",
        border: "1px solid #ccc",
        marginBottom: "1rem",
      }}
    >
      {classes.map((cls) => (
        <option key={cls.class_id} value={cls.class_id}>
          {cls.name}
        </option>
      ))}
    </select>
  );
}

export default ClassDropdown;