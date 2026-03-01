import { SignatureRequestButton } from "@/components/SignatureRequestButton";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Projekt {params.projectId}</h1>
      <SignatureRequestButton projectId={params.projectId} />
    </main>
  );
}
