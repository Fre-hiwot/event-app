import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional filters
    const role = searchParams.get("role"); // e.g. ?role=5

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply role filter if provided
    if (role) {
      query = query.eq("role_id", role);
    }

    const { data, error } = await query;

    // Handle errors
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json(
      {
        users: data,
        count: data.length,
      },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}