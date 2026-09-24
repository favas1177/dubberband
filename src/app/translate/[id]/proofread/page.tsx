import type { Metadata } from "next";
import { ProofreadClient } from "@/components/translation/ProofreadClient";

export const metadata: Metadata = {
  title: "Proofread Script – Dubberband",
  description: "Review and edit your AI translation before finalizing the lip-sync render.",
};

interface ProofreadPageProps {
  params: Promise<{ id: string }>;
}

import { Suspense } from "react";

/**
 * Split-screen proofread editor page.
 * Server Component — passes projectId down to the ProofreadClient.
 */
export default async function ProofreadPage({ params }: ProofreadPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <ProofreadClient projectId={id} />
    </Suspense>
  );
}
