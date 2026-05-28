"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [mode, setMode] = useState<"estimate" | "audit">("estimate");
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function switchMode(newMode: "estimate" | "audit") {
    setMode(newMode);
    reset();
  }

  function reset() {
    setPhase("idle");
    setPreview("");
    setResult(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result as string);
    reader.readAsDataURL(file);

    setPhase("loading");
    setResult(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("mode", mode);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setResult(data);
      setPhase("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze photo");
      setPhase("error");
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "#0A0C14", color: "#E8ECF1", fontFamily: "system-ui, sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800 }}>🌿 CrewRoute</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => switchMode("estimate")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: 600, background: mode === "estimate" ? "#FF6B35" : "#1F2635", color: mode === "estimate" ? "#000" : "#8A95A8" }}>
              Estimate
            </button>
            <button onClick={() => switchMode("audit")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: 600, background: mode === "audit" ? "#FF6B35" : "#1F2635", color: mode === "audit" ? "#000" : "#8A95A8" }}>
              Audit
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          {mode === "estimate" ? "Yard Estimate" : "Job Audit"}
        </h1>

        {phase === "idle" && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: "none" }} />
            <div onClick={() => fileInputRef.current?.click()} style={{ border: "2px dashed #333", borderRadius: "16px", padding: "60px 20px", textAlign: "center", cursor: "pointer", background: "#11151F" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
              <div style={{ fontSize: "18px", fontWeight: 600 }}>Tap to take a photo</div>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            {preview && <img src={preview} alt="preview" style={{ width: "100%", borderRadius: "12px", marginBottom: "24px" }} />}
            <div style={{ fontSize: "18px", fontWeight: 600 }}>Analyzing photo...</div>
          </div>
        )}

        {phase === "done" && result && (
          <div>
            {preview && <img src={preview} alt="preview" style={{ width: "100%", borderRadius: "12px", marginBottom: "20px" }} />}
            <div style={{ background: "#11151F", border: "1px solid #1F2635", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px", margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
            <button onClick={reset} style={{ width: "100%", padding: "16px", background: "#FF6B35", color: "#000", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700 }}>
              Take Another Photo
            </button>
          </div>
        )}

        {phase === "error" && (
          <div>
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ color: "#F87171", fontWeight: 600, marginBottom: "8px" }}>Something went wrong</div>
              <div style={{ color: "#8A95A8" }}>{errorMsg}</div>
            </div>
            <button onClick={reset} style={{ width: "100%", padding: "16px", background: "#FF6B35", color: "#000", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}