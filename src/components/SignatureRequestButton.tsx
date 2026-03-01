"use client";

import Image from "next/image";
import { useState } from "react";

type CreateResponse = { url: string; qrDataUrl: string; expiresAt: number };

export function SignatureRequestButton({ projectId }: { projectId: string }) {
  const [request, setRequest] = useState<CreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createRequest = async () => {
    setError(null);
    const response = await fetch("/api/signature/create-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, docId: "sample-doc", fieldName: "customerSignature" }),
    });
    const data = (await response.json()) as CreateResponse | { error?: string };
    if (!response.ok) {
      setError((data as { error?: string }).error ?? "Fehler beim Erstellen der Anfrage");
      return;
    }
    setRequest(data as CreateResponse);
  };

  return (
    <section>
      <button onClick={createRequest}>Kunden-Signatur anfordern</button>
      {error && <p>{error}</p>}
      {request && (
        <div>
          <p>Gültig bis: {new Date(request.expiresAt).toLocaleString()}</p>
          <Image src={request.qrDataUrl} alt="Signature QR" width={180} height={180} unoptimized />
          <p>{request.url}</p>
        </div>
      )}
    </section>
  );
}
