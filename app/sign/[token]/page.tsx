"use client";

import { type PointerEvent, useRef, useState } from "react";

type SubmitResponse = { success: boolean; pdfUrl: string; version: number };

export default function SignPage({ params }: { params: { token: string } }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const position = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = position(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = position(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const onPointerUp = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submit = async () => {
    setError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL("image/png");
    const emptyCanvas = document.createElement("canvas");
    emptyCanvas.width = canvas.width;
    emptyCanvas.height = canvas.height;
    if (signatureDataUrl === emptyCanvas.toDataURL("image/png")) {
      setError("Bitte erst unterschreiben.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/signature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, signatureDataUrl }),
    });
    const data = (await response.json()) as Partial<SubmitResponse> & { error?: string };
    setIsSubmitting(false);

    if (!response.ok || !data.success || !data.pdfUrl) {
      setError(data.error ?? "Signatur konnte nicht verarbeitet werden.");
      return;
    }

    setPdfUrl(data.pdfUrl);
    setVersion(data.version ?? null);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      {!pdfUrl && (
        <>
          <canvas
            ref={canvasRef}
            width={480}
            height={220}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ border: "1px solid #ccc", borderRadius: 8, touchAction: "none" }}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={clearSignature} type="button">
              Leeren
            </button>
            <button onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "Wird gesendet…" : "Signatur absenden"}
            </button>
          </div>
        </>
      )}
      {error && <p>{error}</p>}
      {pdfUrl && (
        <p>
          Signatur erfolgreich gespeichert{version ? ` (Version ${version})` : ""}. <a href={pdfUrl}>Signiertes PDF herunterladen</a>
        </p>
      )}
    </main>
  );
}
