import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function DELETE() {
  try {
    const now = new Date();

    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const toDelete = [];

    const isExpired = (endDate) => {
      if (!endDate) return false;
      return new Date(endDate) < now;
    };

    for (const ev of events) {
      const ends = ev.end_date_stages || {};

      const earlyExpired = isExpired(ends.early);
      const round2Expired = isExpired(ends.round2);
      const round3Expired = isExpired(ends.round3);

      // 1️⃣ EVENT DATE PASSED → DELETE IMMEDIATELY
      const eventDateExpired =
        ev.date ? new Date(ev.date) < now : true;

      // 2️⃣ ALL TICKETS EXPIRED → DELETE
      const allTicketsExpired =
        earlyExpired &&
        round2Expired &&
        round3Expired;

      if (eventDateExpired || allTicketsExpired) {
        toDelete.push(ev.id);
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({
        message: "No events to delete",
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("events")
      .delete()
      .in("id", toDelete);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Events cleaned successfully",
      deleted: toDelete.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}