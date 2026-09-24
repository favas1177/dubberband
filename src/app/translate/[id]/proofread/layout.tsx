/**
 * Proofread editor layout — full viewport, no sidebar.
 * The root layout provides html/body; this layout provides no additional chrome.
 */
export default function ProofreadEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
