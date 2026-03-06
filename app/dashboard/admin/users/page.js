"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    let query = supabase.from("users").select("*").order("created_at", { ascending: false });
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) console.log(error);
    else setUsers(data);
  }

  async function deleteUser(id) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchUsers();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyUp={fetchUsers}
        className="mb-4 p-2 border rounded"
      />
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-3 border">ID</th>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Email</th>
            <th className="p-3 border">Role</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-center">
              <td className="p-3 border">{u.id}</td>
              <td className="p-3 border">{u.name}</td>
              <td className="p-3 border">{u.email}</td>
              <td className="p-3 border">{u.role_id}</td>
              <td className="p-3 border">{u.status || "active"}</td>
              <td className="p-3 border">
                <button onClick={() => deleteUser(u.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}