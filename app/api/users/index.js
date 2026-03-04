import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { name, email, password, role_id, phone } = req.body;

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password, role_id, phone }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  res.status(405).json({ message: 'Method not allowed' });
}