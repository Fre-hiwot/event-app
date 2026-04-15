import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getCurrentStage } from "../../../../lib/stageHelper";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = Date.now();

    const events = (data || [])
      // ✅ ONLY FILTER BY DATE
      .filter((event) => {
        if (!event.date) return true;

        const d = new Date(event.date.replace(" ", "T"));

        if (isNaN(d.getTime())) return true;

        return d.getTime() >= now;
      })
      .map((event) => {
        const current = getCurrentStage({
          ...event,
          end_date_stages: event.end_date_stages || {},
          price_regular_stages: event.price_regular_stages || {},
        });

        return {
          ...event,
          current_stage: current?.stage || null,
          current_price: current?.price || 0,
        };
      });

    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /events error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}