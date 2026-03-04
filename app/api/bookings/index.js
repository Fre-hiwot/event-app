import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 1️⃣ Create a new booking
    const { user_id, event_id, ticket_quantity } = req.body;

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{ user_id, event_id, ticket_quantity }])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      // Booking total_price is auto-calculated by your database trigger
      res.status(201).json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 

  else if (req.method === 'GET') {
    // 2️⃣ Get bookings for a user (optional: all bookings if no user_id query)
    const { user_id } = req.query;

    try {
      let query = supabase.from('bookings').select('*');

      if (user_id) query = query.eq('user_id', user_id);

      const { data, error } = await query;

      if (error) return res.status(400).json({ error: error.message });

      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 

  else if (req.method === 'PUT') {
    // 3️⃣ Optional: update booking (e.g., ticket quantity)
    const { booking_id, ticket_quantity } = req.body;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ ticket_quantity })
        .eq('id', booking_id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 

  else if (req.method === 'DELETE') {
    // 4️⃣ Optional: delete booking
    const { booking_id } = req.body;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });

      res.status(200).json({ message: 'Booking deleted', data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 

  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}