"use client";

import { useRef, useState, type PointerEvent } from "react";

export default function SignPage({ params }: { params: { token: string } }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pointerPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = pointerPosition(event);
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = "#111";
    context.lineWidth = 2;
    context.lineCap = "round";
    setIsDrawing(true);
    setHasStroke(true);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const { x, y } = pointerPosition(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setPdfUrl(null);

    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) {
      setError("Bitte unterschreiben Sie im Feld, bevor Sie absenden.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/signature/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, signatureDataUrl: canvas.toDataURL("image/png") }),
      });
      const data = (await response.json()) as { pdfUrl?: string; error?: string };

      if (!response.ok || !data.pdfUrl) {
        setError(data.error ?? "Signatur konnte nicht gespeichert werden.");
        return;
      }

      setPdfUrl(data.pdfUrl);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      <p>Bitte unterschreiben Sie im Feld und senden Sie die Signatur ab.</p>
      <canvas
        ref={canvasRef}
        width={420}
        height={180}
        style={{ border: "1px solid #ccc", width: "100%", maxWidth: 420, background: "#fff" }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="button" onClick={clear}>
          Zurücksetzen
        </button>
        <button type="button" onClick={submit} disabled={submitting}>
          {submitting ? "Wird gesendet..." : "Signatur absenden"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {pdfUrl && (
        <p>
          Signatur erfolgreich. <a href={pdfUrl}>Signiertes PDF herunterladen</a>
        </p>
      )}
    </main>
  );
}
