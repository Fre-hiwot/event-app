import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1. Fetch counts in parallel
    const [
      usersRes,
      eventsRes,
      bookingsRes,
      categoriesRes,
      recentUsersRes,
      recentEventsRes,
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),

      supabase
        .from("users")
        .select("id, name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("events")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // 2. Handle errors
    if (
      usersRes.error ||
      eventsRes.error ||
      bookingsRes.error ||
      categoriesRes.error
    ) {
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // 3. Extract counts
    const stats = {
      totalUsers: usersRes.count || 0,
      totalEvents: eventsRes.count || 0,
      totalBookings: bookingsRes.count || 0,
      totalCategories: categoriesRes.count || 0,
    };

    // 4. Growth (last 7 days users)
    const { data: weeklyUsers } = await supabase
      .from("users")
      .select("created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const growth = {
      newUsersThisWeek: weeklyUsers?.length || 0,
    };

    // 5. Final response
    return NextResponse.json(
      {
        stats,
        growth,
        recentUsers: recentUsersRes.data || [],
        recentEvents: recentEventsRes.data || [],
      },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}