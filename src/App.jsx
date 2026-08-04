import React from "react";

/* Placeholder until BUILD 78 is ported in (Track 2, milestone 2).

   To port: save the artifact's full source as src/App.original.jsx, then we
   refactor it into this file — swapping the hardcoded BASELINE for a database
   seed and pointing the AI commentary at a real key. */

export default function App() {
  const wrap = {
    fontFamily: "system-ui, sans-serif",
    maxWidth: 560,
    margin: "0 auto",
    padding: "40px 20px",
    color: "#23281F",
  };
  const box = {
    background: "#EAF0EA",
    border: "1px dashed #2F4A33",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    lineHeight: 1.5,
  };
  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 22 }}>Minto Pastoral — Farm Records</h1>
      <p style={{ color: "#6a6f60" }}>Local development scaffold · storage: localStorage</p>
      <div style={box}>
        <strong>Scaffold is running.</strong>
        <p>Next step: port BUILD 78 into <code>src/App.jsx</code>.</p>
        <p style={{ margin: 0 }}>See <code>README.md</code> for the plan and what to drop in.</p>
      </div>
    </div>
  );
}
