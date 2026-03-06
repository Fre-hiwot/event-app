"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function CategoriesPage() {

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {

    const { data } = await supabase
      .from("categories")
      .select("*");

    setCategories(data || []);
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">Event Categories</h1>

      <div className="grid md:grid-cols-3 gap-4">

        {categories.map((cat) => (
          <div key={cat.id} className="p-4 bg-white shadow rounded">
            {cat.name}
          </div>
        ))}

      </div>

    </div>
  );
}