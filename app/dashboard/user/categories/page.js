"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) console.log(error);
    else setCategories(data);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Event Categories</h2>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.id} className="p-3 bg-white rounded shadow hover:bg-gray-200 cursor-pointer">
            {cat.name}
          </li>
        ))}
      </ul>
    </div>
  );
}