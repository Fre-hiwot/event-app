import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function DELETE(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { user_role, user_id, event_id } = body;

    const { data: event, error: fetchErr } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (fetchErr || !event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (user_role === 6 && event.created_by !== user_id) {
      return NextResponse.json({ error: "Forbidden: cannot delete this event" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", event_id);

    if (error) throw error;

    await auditLogger(user_id, "delete", "event", event_id, event.title);

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete Event API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}