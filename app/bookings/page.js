import { supabase } from "@/lib/supabase";

export default async function BookingsPage() {
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", 1);

  return (
    <div>
      <h1>My Bookings</h1>

      {bookings?.map((b) => (
        <div key={b.id}>
          <p>Event ID: {b.event_id}</p>
          <p>Total: {b.total_price}</p>
          <a href={`/ticket/${b.id}`}>View Ticket</a>
        </div>
      ))}
    </div>
  );
}