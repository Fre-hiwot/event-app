import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(req) {
  try {
    const body = await req.json();

    const { notification_id, user_id } = body;

    // Option 1: mark single notification
    if (notification_id) {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification_id)
        .select();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "Notification marked as read", data },
        { status: 200 }
      );
    }

    // Option 2: mark all for a user
    if (user_id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user_id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: "All notifications marked as read" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Provide notification_id or user_id" },
      { status: 400 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}