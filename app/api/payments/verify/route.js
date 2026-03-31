import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { tx_ref, status } = body;

    if (!tx_ref || !status) {
      return NextResponse.json(
        { error: "tx_ref and status are required" },
        { status: 400 }
      );
    }

    // 1. Find payment
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("tx_ref", tx_ref)
      .maybeSingle();

    if (findError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // 2. Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({ status })
      .eq("tx_ref", tx_ref);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 3. If successful → update booking
    if (status === "success") {
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", payment.booking_id);

      // 4. Send notification
      await supabase.from("notifications").insert([
        {
          user_id: payment.user_id,
          type: "payment",
          message: "Your payment was successful 🎉",
        },
      ]);
    }

    return NextResponse.json(
      { message: "Payment verified successfully" },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}