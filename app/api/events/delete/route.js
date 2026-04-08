import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function DELETE(req) {
  try {
    // 1️⃣ Get token from Authorization header
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2️⃣ Get event_id from request body
    const body = await req.json();
    const { event_id } = body;
    if (!event_id) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    // 3️⃣ Get the user associated with the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = user.id;

    // 4️⃣ Fetch the event
    const { data: event, error: fetchErr } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (fetchErr || !event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // 5️⃣ Check permissions
    // Admin role_id = 5, Organizer role_id = 6
    const { role_id } = user.user_metadata || {}; // adjust based on your Supabase setup
    if (role_id === 6 && event.created_by !== userId) {
      return NextResponse.json({ error: "Forbidden: cannot delete this event" }, { status: 403 });
    }

    // 6️⃣ Delete the event
    const { error: deleteErr } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", event_id);

    if (deleteErr) throw deleteErr;

    // 7️⃣ Log deletion
    await auditLogger(userId, "delete", "event", event_id, event.title);

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });

  } catch (err) {
    console.error("Delete Event API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}