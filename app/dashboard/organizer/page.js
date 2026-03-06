"use client";

import Link from "next/link";

export default function OrganizerDashboard() {
  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Organizer Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">

        <Link
          href="/dashboard/organizer/events"
          className="bg-blue-50 black text-black p-6 rounded shadow hover:bg-blue-600"
        >
          Manage My Events
        </Link>

        <Link
          href="/dashboard/organizer/events/create"
          className="bg-green-500 text-black p-6 rounded shadow hover:bg-green-600"
        >
          Create New Event
        </Link>

        <Link
          href="/dashboard/organizer/categories"
          className="bg-purple-500 text-black p-6 rounded shadow hover:bg-purple-600"
        >
          View Categories
        </Link>

      </div>

    </div>
  );
}