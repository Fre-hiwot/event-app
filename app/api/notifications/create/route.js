import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();

    const { user_id, type, message } = body;

    // 1. Validation
    if (!user_id || !type || !message) {
      return NextResponse.json(
        { error: "user_id, type and message are required" },
        { status: 400 }
      );
    }

    // 2. Insert notification
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id,
          type,
          message,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Notification created",
        notification: data[0],
      },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}