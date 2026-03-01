"use client";

import { useState } from "react";

export default function SignPage({ params }: { params: { token: string } }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const submit = async () => {
    const signatureDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XxjVfQAAAABJRU5ErkJggg==";
    const response = await fetch("/api/signature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, signatureDataUrl }),
    });
    const data = (await response.json()) as { pdfUrl?: string };
    setPdfUrl(data.pdfUrl ?? null);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      <button onClick={submit}>Signatur absenden</button>
      {pdfUrl && <a href={pdfUrl}>Signiertes PDF herunterladen</a>}
    </main>
  );
}
