import { supabase } from "../../lib/supabase";
export default async function TicketPage({ params }) {
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, bookings(*)")
    .eq("booking_id", params.id)
    .single();

  if (!ticket) return <p>Ticket not found</p>;

  return (
    <div>
      <h1>Your Ticket</h1>
      <p>Booking ID: {ticket.booking_id}</p>
      <p>QR Code: {ticket.qr_code}</p>
    </div>
  );
}