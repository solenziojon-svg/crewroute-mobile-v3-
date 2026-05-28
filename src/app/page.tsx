"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [mode, setMode] = useState<"estimate" | "audit">("estimate");
  const [phase, setPhase] = useState<"upload" | "loading" | "result" | "error">("upload");
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setPhase("loading");
    setErrorMsg("");

    const form = new FormData();
    form.append("photo", file);
    form.append("mode", mode);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Server error");
        setPhase("error");
        return;
      }

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
    setResult(null);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <main style={{
      background: "#0A0C14",
      color: "#E8ECF1",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <div style={{ fontSize: "22px", fontWeight: 800 }}>🌿 CrewRoute</div>
          
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => { setMode("estimate"); reset(); }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                background: mode === "estimate" ? "#FF6B35" : "#1F2635",
                color: mode === "estimate" ? "#000" : "#8A95A8",
              }}
            >
              Estimate
            </button>
            <button
              onClick={() => { setMode("audit"); reset(); }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                background: mode === "audit" ? "#FF6B35" : "#1F2635",
                color: mode === "audit" ? "#000" : "#8A95A8",
              }}
            >
              Audit
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          {mode === "estimate" ? "Yard Estimate" : "Job Audit"}
        </h1>
        <p style={{ color: "#8A95A8", fontSize: "14px", marginBottom: "24px" }}>
          {mode === "estimate" 
            ? "Take a photo of the yard to get an instant price." 
            : "Take a photo of completed work to audit quality."}
        </p>

        {phase === "upload" && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            
            <div 
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #333",
                borderRadius: "16px",
                padding: "60px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "#11151F"
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                Tap to take a photo
              </div>
              <div style={{ fontSize: "13px", color: "#8A95A8" }}>
                or choose from your gallery
              </div>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🤖</div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>Analyzing photo...</div>
            <div style={{ color: "#8A95A8", marginTop: "8px" }}>
              Claude Vision is processing your image
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div>
            {preview && (
              <img 
                src={preview} 
                alt="preview" 
                style={{ 
                  width: "100%", 
                  borderRadius: "12px", 
                  marginBottom: "20px",
                  border: "1px solid #1F2635"
                }} 
              />
            )}
            
            <div style={{ 
              background: "#11151F", 
              border: "1px solid #1F2635", 
              borderRadius: "12px", 
              padding: "16px",
              marginBottom: "16px"
            }}>
              <pre style={{ 
                whiteSpace: "pre-wrap", 
                fontSize: "13px", 
                margin: 0,
                color: "#E8ECF1"
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <button 
              onClick={reset}
              style={{
                width: "100%",
                padding: "16px",
                background: "#FF6B35",
                color: "#000",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700
              }}
            >
              Take Another Photo
            </button>
          </div>
        )}

        {phase === "error" && (
          <div style={{ 
            background: "rgba(248, 113, 113, 0.1)", 
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center"
          }}>
            <div style={{ color: "#F87171", fontWeight: 600, marginBottom: "8px" }}>
              Something went wrong
            </div>
            <div style={{ color: "#8A95A8", fontSize: "14px", marginBottom: "16px" }}>
              {errorMsg}
            </div>
            <button 
              onClick={reset}
              style={{
                padding: "12px 24px",
                background: "#FF6B35",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}