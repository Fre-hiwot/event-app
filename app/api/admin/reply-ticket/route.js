import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { ticket_id, admin_id, message } = await req.json();
    if (!ticket_id || !message) {
      return NextResponse.json({ error: "Ticket ID and message are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("support_replies")
      .insert({ ticket_id, admin_id, message });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to send reply" }, { status: 500 });
  }
}