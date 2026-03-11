"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function ManageOrganizers() {

  const [organizers, setOrganizers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    fetchOrganizers();
  }, []);

  async function fetchOrganizers() {

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role_id", 6);

    setOrganizers(data || []);
  }

  async function addOrganizer(e) {

    e.preventDefault();

    const { error } = await supabase
      .from("users")
      .insert([
        {
          name: form.name,
          email: form.email,
          password: form.password,
          role_id: 6
        }
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setForm({
      name: "",
      email: "",
      password: ""
    });

    fetchOrganizers();
  }

  async function deleteOrganizer(id) {

    const confirmDelete = confirm("Delete this organizer?");
    if (!confirmDelete) return;

    await supabase
      .from("users")
      .delete()
      .eq("id", id);

    fetchOrganizers();
  }

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">Manage Organizers</h1>

      {/* Add Organizer */}

      <form
        onSubmit={addOrganizer}
        className="mb-8 bg-white p-6 shadow rounded flex flex-col gap-4"
      >

        <h2 className="text-xl font-semibold">Add Organizer</h2>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e)=>setForm({...form,name:e.target.value})}
          className="border p-2 rounded"
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e)=>setForm({...form,email:e.target.value})}
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e)=>setForm({...form,password:e.target.value})}
          className="border p-2 rounded"
        />

        <button className="bg-green-600 text-black p-2 rounded">
          Add Organizer
        </button>

      </form>

      {/* Organizer List */}

      <div className="bg-white shadow rounded p-6">

        <h2 className="text-xl font-semibold mb-4">Organizer List</h2>

        <table className="w-full border">

          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>

          <tbody>

            {organizers.map((org)=>(
              <tr key={org.id} className="border-t">

                <td className="p-2">{org.name}</td>
                <td className="p-2">{org.email}</td>

                <td className="p-2">

                  <button
                    onClick={()=>deleteOrganizer(org.id)}
                    className="bg-red-500 text-black px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  {/* <button
                    onClick={()=>editOrganizer(org.id)}
                    className="bg-red-500 text-black px-3 py-1 rounded"
                  >
                    edit
                  </button> */}

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}