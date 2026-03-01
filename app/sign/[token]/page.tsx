"use client";

import { useRef, useState } from "react";

export default function SignPage({ params }: { params: { token: string } }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    return { canvas, ctx };
  };

  const start = (x: number, y: number) => {
    const data = getContext();
    if (!data) return;
    drawing.current = true;
    data.ctx.beginPath();
    data.ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!drawing.current) return;
    const data = getContext();
    if (!data) return;
    data.ctx.lineTo(x, y);
    data.ctx.stroke();
  };

  const submit = async () => {
    setError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL("image/png");

    const response = await fetch("/api/signature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, signatureDataUrl }),
    });

    const data = (await response.json()) as { pdfUrl?: string; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Signatur konnte nicht gespeichert werden.");
      return;
    }

    setPdfUrl(data.pdfUrl ?? null);
  };

  const clear = () => {
    const data = getContext();
    if (!data) return;
    data.ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        style={{ border: "1px solid #ccc", marginBottom: 16, touchAction: "none" }}
        onMouseDown={(e) => start(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
        onMouseMove={(e) => draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
        onMouseUp={() => {
          drawing.current = false;
        }}
        onMouseLeave={() => {
          drawing.current = false;
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={clear}>Löschen</button>
        <button onClick={submit}>Signatur absenden</button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {pdfUrl && <a href={pdfUrl}>Signiertes PDF herunterladen</a>}
    </main>
  );
}
