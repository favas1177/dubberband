import { TopHeader } from "@/components/layout/TopHeader";

export default function SettingsPage() {
  return (
    <>
      <TopHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings" },
        ]}
      />
      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">API Keys Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sarvam API Key</label>
                <input type="password" placeholder="sk_..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">HeyGen API Key</label>
                <input type="password" placeholder="ysk_..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Credit Balance</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Available Credits</span>
              <span className="font-bold text-indigo-600">340 / 500</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
