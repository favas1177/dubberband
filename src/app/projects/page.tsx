import { TopHeader } from "@/components/layout/TopHeader";

export default function ProjectsPage() {
  return (
    <>
      <TopHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Projects" },
        ]}
      />
      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Projects</h1>
        <p className="text-slate-500">Dedicated projects table view (Placeholder)</p>
      </div>
    </>
  );
}
