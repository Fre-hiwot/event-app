"use client";

import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // CREATE USER STATE
  const [creatingUser, setCreatingUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(7);

  // EDIT USER STATE
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-users");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch users");

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  // ================= STATS =================
  const totalUsers = users.filter((u) => u.role_id === 7).length;
  const totalOrganizers = users.filter((u) => u.role_id === 6).length;
  const totalAdmins = users.filter((u) => u.role_id === 5).length;

  // ================= CREATE USER =================
  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword)
      return alert("All fields are required");

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role_id: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to create user");

      setUsers((prev) => [...prev, data.user]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole(7);
      setCreatingUser(false);
      alert("User created successfully!");
    } catch (err) {
      console.error(err);
      alert("Unexpected error creating user");
    }
  };

  // ================= EDIT =================
  const startEditing = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
  };

  const saveEditing = async () => {
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          role_id: editingUser.role_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to update user");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: editName, email: editEmail }
            : u
        )
      );
      cancelEditing();
      alert("User updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating user");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("User deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Manage Users</h1>

      {/* ===== STATS ===== */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white shadow p-4 rounded w-40 text-center">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-xl font-bold">{totalUsers}</p>
        </div>

        <div className="bg-white shadow p-4 rounded w-40 text-center">
          <p className="text-sm text-gray-500">Organizers</p>
          <p className="text-xl font-bold">{totalOrganizers}</p>
        </div>

        <div className="bg-white shadow p-4 rounded w-40 text-center">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-xl font-bold">{totalAdmins}</p>
        </div>
      </div>

      {/* ===== CREATE USER ===== */}
      {!creatingUser ? (
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => setCreatingUser(true)}
        >
          + Create New User
        </button>
      ) : (
        <div className="bg-gray-100 p-4 rounded space-y-2 max-w-md">
          <input
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <input
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <input
            placeholder="Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(parseInt(e.target.value))}
            className="border p-2 w-full rounded"
          >
            <option value={5}>Admin</option>
            <option value={6}>Organizer</option>
            <option value={7}>User</option>
          </select>

          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-green-500 text-white rounded"
              onClick={handleCreateUser}
            >
              Create
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded"
              onClick={() => setCreatingUser(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===== USERS TABLE ===== */}
      <table className="min-w-full bg-white border border-gray-200 shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Role</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4">
                No users found
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">
                  {editingUser?.id === u.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border px-2 py-1 w-full rounded"
                    />
                  ) : (
                    u.name
                  )}
                </td>
                <td className="px-4 py-2 border">
                  {editingUser?.id === u.id ? (
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="border px-2 py-1 w-full rounded"
                    />
                  ) : (
                    u.email
                  )}
                </td>
                <td className="px-4 py-2 border">
                  {u.role_id === 5
                    ? "Admin"
                    : u.role_id === 6
                    ? "Organizer"
                    : "User"}
                </td>
                <td className="px-4 py-2 border flex gap-2">
                  {editingUser?.id === u.id ? (
                    <>
                      <button
                        className="px-3 py-1 bg-green-500 text-white rounded"
                        onClick={saveEditing}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                        onClick={() => startEditing(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}