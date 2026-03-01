"use client";

import { useRef, useState, type PointerEvent } from "react";

type SubmitResponse = { success?: boolean; pdfUrl?: string; error?: string };

export default function SignPage({ params }: { params: { token: string } }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const withContext = (fn: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    fn(ctx);
  };

  const position = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = position(event);
    setIsDrawing(true);
    withContext((ctx) => {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = position(event);
    withContext((ctx) => {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    });
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    withContext((ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    setResult(null);
  };

  const submit = async () => {
    const signatureDataUrl = canvasRef.current?.toDataURL("image/png");
    if (!signatureDataUrl) return;

    const response = await fetch("/api/signature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, signatureDataUrl }),
    });

    setResult((await response.json()) as SubmitResponse);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      <p>Bitte unterschreiben Sie im Feld und senden Sie die Signatur ab.</p>
      <canvas
        ref={canvasRef}
        width={500}
        height={220}
        style={{ border: "1px solid #cfcfcf", background: "#fff", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={submit}>Signatur absenden</button>
        <button onClick={clearCanvas}>Zurücksetzen</button>
      </div>

      {result?.success && result.pdfUrl && (
        <p style={{ marginTop: 12 }}>
          Erfolgreich signiert: <a href={result.pdfUrl}>Signiertes PDF herunterladen</a>
        </p>
      )}
      {result?.error && <p style={{ marginTop: 12, color: "#b00020" }}>Fehler: {result.error}</p>}
    </main>
  );
}
