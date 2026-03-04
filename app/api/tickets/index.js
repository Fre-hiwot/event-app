import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { booking_id } = req.body;

    const { data, error } = await supabase
      .from('tickets')
      .insert([{ booking_id }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'GET') {
    const { booking_id } = req.query;
    const { data, error } = await supabase.from('tickets').select('*').eq('booking_id', booking_id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  res.status(405).json({ message: 'Method not allowed' });
}