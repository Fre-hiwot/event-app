"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Helper to check if link is active
  const isActive = (href) => pathname.startsWith(href);

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>

      <nav className="flex flex-col gap-2">
        {/* Main Sections */}

            <Link href="/dashboard/admin/audit" className="px-3 py-2 hover:bg-gray-700 rounded">Audit & logs</Link>
            <Link href="/dashboard/admin/bookings" className="px-3 py-2 hover:bg-gray-700 rounded">Booking & Transactions</Link>
            <Link href="/events" className="px-3 py-2 hover:bg-gray-700 rounded">Event & category Management</Link>
            <Link href="/dashboard/admin/users" className="px-3 py-2 hover:bg-gray-700 rounded">User & Role Management</Link>
        {/* Collapsible Settings Section */}
        <button 
          onClick={() => setSettingsOpen(!settingsOpen)} 
          className="px-3 py-2 rounded hover:bg-gray-700 flex justify-between items-center w-full"
        >
          Settings
          <span>{settingsOpen ? "▲" : "▼"}</span>
        </button>

        {settingsOpen && (
          <div className="flex flex-col ml-4 gap-2 mt-2">
        <Link href="/dashboard/admin/settings" className={`px-3 py-2 rounded hover:bg-gray-700 ${isActive("/dashboard/admin/settings") ? "bg-gray-700" : ""}`}>
            Notifications & Communications
        </Link>

        <Link href="/dashboard/admin/settings/profile" className={`px-3 py-2 rounded hover:bg-gray-700 ${isActive("/dashboard/admin/settings/profile") ? "bg-gray-700" : ""}`}>
            Profile & Account
        </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}