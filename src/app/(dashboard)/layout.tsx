import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Dashboard layout — wraps all main app pages with the fixed left Sidebar.
 * Lives in the (dashboard) route group so the proofread editor can opt out.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        {children}
      </div>
    </>
  );
}
