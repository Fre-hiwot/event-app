import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // ✅ IF ID EXISTS → return single category
    if (id) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, image") // include image
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ category: data }, { status: 200 });
    }

    // ✅ OTHERWISE → return all categories
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, image") // include image
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data }, { status: 200 });

  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}