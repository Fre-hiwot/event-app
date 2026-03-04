"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase
          .from("users")
          .select("*")
          .eq("email", data.session.user.email)
          .single()
          .then(({ data }) => setUser(data));
      }
    });
  }, []);

  if (!user) return <p>Loading dashboard...</p>;

  return (
    <div className="p-8 min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome, {user.name}</p>

      {user.role_id === 5 && (
        <div>
          <h2 className="text-2xl font-semibold mt-4">Admin Panel</h2>
          <ul>
            <li><Link href="/events/manage" className="underline">Manage Events</Link></li>
            <li><Link href="/users" className="underline">Manage Users</Link></li>
            <li><Link href="/analytics" className="underline">View Analytics</Link></li>
          </ul>
        </div>
      )}

      {user.role_id === 6 && (
        <div>
          <h2 className="text-2xl font-semibold mt-4">Organizer Panel</h2>
          <ul>
            <li><Link href="/events/manage" className="underline">My Events</Link></li>
          </ul>
        </div>
      )}

      {user.role_id === 7 && (
        <div>
          <h2 className="text-2xl font-semibold mt-4">User Panel</h2>
          <ul>
            <li><Link href="/events" className="underline">Browse Events</Link></li>
            <li><Link href="/bookings" className="underline">My Bookings</Link></li>
          </ul>
        </div>
      )}
    </div>
  );
}