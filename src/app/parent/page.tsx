import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function ParentDashboard() {
  try {
    await requireParent();
  } catch {
    redirect("/login");
  }

  const db = getDb();
  const pendingCount = (db
    .query("SELECT COUNT(*) as n FROM watch_requests WHERE status = 'pending'")
    .get() as { n: number }).n;
  const kidCount = (db
    .query("SELECT COUNT(*) as n FROM users WHERE role = 'kid'")
    .get() as { n: number }).n;
  const channelCount = (db
    .query("SELECT COUNT(*) as n FROM allowed_channels")
    .get() as { n: number }).n;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-red-500 font-bold text-xl">KidTube</h1>
        <span className="text-gray-400 text-sm">Parent Dashboard</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/parent/requests" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-yellow-400">{pendingCount}</div>
            <div className="text-gray-400 mt-1">Pending Requests</div>
          </a>
          <a href="/parent/kids" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400">{kidCount}</div>
            <div className="text-gray-400 mt-1">Kids</div>
          </a>
          <a href="/parent/channels" className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400">{channelCount}</div>
            <div className="text-gray-400 mt-1">Allowed Channels</div>
          </a>
        </div>

        <nav className="grid grid-cols-2 gap-4">
          {[
            { href: "/parent/requests", label: "Review Requests", desc: "Approve or deny video requests" },
            { href: "/parent/channels", label: "Allowed Channels", desc: "Manage pre-approved channels" },
            { href: "/parent/kids", label: "Manage Kids", desc: "Add or manage kid accounts" },
            { href: "/parent/history", label: "Watch History", desc: "See what kids have watched" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl p-5"
            >
              <div className="font-semibold">{item.label}</div>
              <div className="text-sm text-gray-400 mt-1">{item.desc}</div>
            </a>
          ))}
        </nav>

        <div className="text-right">
          <a href="/parent/signout" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Sign out
          </a>
        </div>
      </main>
    </div>
  );
}
