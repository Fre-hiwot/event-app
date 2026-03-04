import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { booking_id, payment_gateway_id, status } = req.body;

    const { data, error } = await supabase
      .from('payments')
      .insert([{ booking_id, payment_gateway_id, status }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'GET') {
    const { user_id } = req.query;
    const { data, error } = await supabase
      .from('payments')
      .select('id, booking_id, amount, status, created_at, bookings(user_id)')
      .eq('bookings.user_id', user_id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  res.status(405).json({ message: 'Method not allowed' });
}