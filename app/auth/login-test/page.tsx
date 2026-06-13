"use client";

import { useState } from "react";

export default function LoginTestPage() {
  const [clicked, setClicked] = useState(false);
  
  return (
    <div style={{ padding: "50px", backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>Test Mobile Login Page</h1>
      <p>Can you click this button?</p>
      <button 
        onClick={() => setClicked(true)}
        style={{ padding: "20px", fontSize: "20px", backgroundColor: "blue", color: "white", marginTop: "20px" }}
      >
        {clicked ? "Clicked! It works!" : "Click Me Test"}
      </button>
      
      {clicked && <p style={{ marginTop: "20px", color: "green" }}>Event fired successfully!</p>}
    </div>
  );
}
