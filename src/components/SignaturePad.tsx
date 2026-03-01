"use client";

import { useRef, useState } from "react";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const drawPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const finish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(false);
    const ctx = canvas.getContext("2d");
    ctx?.beginPath();
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        style={{ border: "1px solid #ccc", borderRadius: 8, background: "white" }}
        onMouseDown={(e) => {
          setDrawing(true);
          drawPoint(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => drawing && drawPoint(e.clientX, e.clientY)}
        onMouseUp={finish}
        onMouseLeave={finish}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={clear}>
          Signatur löschen
        </button>
      </div>
    </div>
  );
}
