"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      // Check login
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      setUser(data.user);

      // Get categories with event count
      const { data: categoryData } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          events(count)
        `);

      setCategories(categoryData || []);
    };

    loadData();
  }, [router]);

  if (!user) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen p-10 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
        Welcome, {user.email}
      </h1>

      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
        Event Categories
      </h2>

      <div className="grid grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => router.push(`/categories/${cat.id}`)}
            className="p-6 bg-white dark:bg-zinc-900 rounded shadow cursor-pointer hover:scale-105 transition"
          >
            <h3 className="text-xl font-semibold text-black dark:text-white">
              {cat.name}
            </h3>
            <p className="text-gray-500">
              {cat.events?.[0]?.count || 0} events
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}