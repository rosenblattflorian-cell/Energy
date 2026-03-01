"use client";

import { useState } from "react";

type CreateResponse = { url: string; qrDataUrl: string; expiresAt: string };

export function SignatureRequestButton({ projectId }: { projectId: string }) {
  const [request, setRequest] = useState<CreateResponse | null>(null);

  const createRequest = async () => {
    const response = await fetch("/api/signature/create-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, docId: "sample-doc" }),
    });
    const data = (await response.json()) as CreateResponse;
    setRequest(data);
  };

  return (
    <section>
      <button onClick={createRequest}>Kunden-Signatur anfordern</button>
      {request && (
        <div>
          <p>Gültig bis: {new Date(request.expiresAt).toLocaleString()}</p>
          <img src={request.qrDataUrl} alt="Signature QR" width={180} height={180} />
          <p>{request.url}</p>
        </div>
      )}
    </section>
  );
}
