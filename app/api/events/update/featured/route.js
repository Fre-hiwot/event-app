// C:\Users\Frehiwot.Mandefro\Documents\event\event-app\app\api\events\update\featured\route.js
import { supabase } from "../../../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_id, is_featured } = body;

    if (!event_id || typeof is_featured !== "boolean") {
      return NextResponse.json(
        { error: "event_id and is_featured are required" },
        { status: 400 }
      );
    }

    // Optional: check if user is admin/organizer
    // For now, assume authentication is handled elsewhere
    const { data, error } = await supabase
      .from("events")
      .update({ is_featured })
      .eq("id", event_id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Event updated successfully", event: data }, { status: 200 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}