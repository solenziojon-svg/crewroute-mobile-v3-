"use client";

import { useState } from "react";

export default function Home() {
  const = useState<"estimate" | "audit">("estimate");
  const = useState<"upload" | "loading" | "result" | "error">("upload");
  const = useState<string>("");
  const = useState<any>(null);
  const = useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setPhase("loading");

    const form = new FormData();
    form.append("photo", file);
    form.append("mode", mode);

    try {
      const res = await fetch("/api/analyze", { 
        method: "POST", 
        body: form 
      });
      const data = await res.json();
      setResult(data);
      setPhase("result");
    } catch (err) {
      setErrorMsg("Failed to analyze photo");
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("upload");
    setPreview("");
    setResult({});
    setErrorMsg("");
  };

  return (
    <main style={{ background: "#0A0C14", color: "#E8ECF1", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>CrewRoute Mobile v3</h1>

      {phase === "upload" && (
        <div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{
            display: "block",
            padding: "40px 20px",
            border: "2px dashed #444",
            borderRadius: "12px",
            textAlign: "center",
            cursor: "pointer"
          }}>
            📸 Tap to take a photo
          </label>
        </div>
      )}

      {phase === "loading" && <p>Analyzing with Claude...</p>}

      {phase === "result" && result && (
        <div>
          {preview && <img src={preview} alt="preview" style={{ width: "100%", borderRadius: "12px", marginBottom: "15px" }} />}
          <pre style={{ background: "#111", padding: "15px", borderRadius: "12px", fontSize: "12px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <button onClick={reset} style={{
            marginTop: "15px",
            padding: "15px",
            width: "100%",
            background: "#FF6B35",
            color: "black",
            border: "none",
            borderRadius: "12px",
            fontWeight: "bold"
          }}>
            New Photo
          </button>
        </div>
      )}

      {phase === "error" && (
        <div>
          <p>Error occurred</p>
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    </main>
  );
}