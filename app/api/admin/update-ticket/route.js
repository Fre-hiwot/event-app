import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { auditLogger } from "../../../../lib/auditLogger";

export async function PUT(req) {
  try {
    const { ticket_id, status } = await req.json();
    if (!ticket_id || !status) {
      return NextResponse.json({ error: "Ticket ID and status are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update({ status })
      .eq("id", ticket_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update ticket" }, { status: 500 });
  }
}