"use client";

import { useState } from "react";
import { SignaturePad } from "@/components/SignaturePad";

export default function SignPage({ params }: { params: { token: string } }) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!signatureDataUrl) {
      setError("Bitte zuerst unterschreiben.");
      return;
    }

    setError(null);
    const response = await fetch("/api/signature/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, signatureDataUrl }),
    });

    const data = (await response.json()) as { error?: string; pdfUrl?: string };
    if (!response.ok) {
      setError(data.error ?? "Signatur konnte nicht gesendet werden.");
      return;
    }

    setPdfUrl(data.pdfUrl ?? null);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Signaturseite</h1>
      <SignaturePad onChange={setSignatureDataUrl} />
      <button onClick={submit} style={{ marginTop: 12 }}>
        Signatur absenden
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {pdfUrl && (
        <p>
          Fertig: <a href={pdfUrl}>Signiertes PDF herunterladen</a>
        </p>
      )}
    </main>
  );
}
