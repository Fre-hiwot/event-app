"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

export default function EditUser() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState({ name: "", email: "", role_id: 7 });

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
      if (error) console.log(error);
      else setUser(data);
    }
    fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    const { error } = await supabase.from("users").update(user).eq("id", id);
    if (error) alert(error.message);
    else router.push("/dashboard/admin/users");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Edit User</h2>
      <input className="mb-2 p-2 border w-full" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} placeholder="Name" />
      <input className="mb-2 p-2 border w-full" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="Email" />
      <select className="mb-2 p-2 border w-full" value={user.role_id} onChange={(e) => setUser({ ...user, role_id: parseInt(e.target.value) })}>
        <option value={5}>Admin</option>
        <option value={6}>Organizer</option>
        <option value={7}>User</option>
      </select>
      <button onClick={handleUpdate} className="bg-blue-600 text-white p-2 rounded">Update</button>
    </div>
  );
}