"use client";

import { useEffect, useState } from "react";
import style from "../../../styles/dashboard/admin/users.module.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTER STATE
  const [roleFilter, setRoleFilter] = useState("all");

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

  // ================= FILTERED USERS =================
  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;
    return u.role_id === parseInt(roleFilter);
  });

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
        headers: {"Content-Type": "application/json"},
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
        headers: {"Content-Type": "application/json"},
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
        headers: {"Content-Type": "application/json"},
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

  if (loading) return <p className={style.loading}>Loading users...</p>;

  return (
    <div className={style.container}>
      <h1 className={style.title}>Manage Users</h1>

      {/* ===== STATS ===== */}
      <div className={style.stats}>
        <div className={style.statCard}>
          <p>Users</p>
          <h2>{totalUsers}</h2>
        </div>

        <div className={style.statCard}>
          <p>Organizers</p>
          <h2>{totalOrganizers}</h2>
        </div>

        <div className={style.statCard}>
          <p>Admins</p>
          <h2>{totalAdmins}</h2>
        </div>
      </div>

      {/* ===== FILTER ===== */}
      <div className={style.filterContainer}>
        <label>Filter by Role:</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={style.select}
        >
          <option value="all">All</option>
          <option value="5">Admin</option>
          <option value="6">Organizer</option>
          <option value="7">User</option>
        </select>
      </div>

      {/* ===== CREATE USER ===== */}
      {!creatingUser ? (
        <button
          className={style.createBtn}
          onClick={() => setCreatingUser(true)}
        >
          + Create New User
        </button>
      ) : (
        <div className={style.form}>
          <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

          <select value={newRole} onChange={(e) => setNewRole(parseInt(e.target.value))}>
            <option value={5}>Admin</option>
            <option value={6}>Organizer</option>
            <option value={7}>User</option>
          </select>

          <div className={style.formButtons}>
            <button onClick={handleCreateUser}>Create</button>
            <button onClick={() => setCreatingUser(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <table className={style.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="4" className={style.noData}>
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  {editingUser?.id === u.id ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : u.name}
                </td>

                <td>
                  {editingUser?.id === u.id ? (
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  ) : u.email}
                </td>

                <td>
                  {u.role_id === 5 ? "Admin" :
                   u.role_id === 6 ? "Organizer" : "User"}
                </td>

                <td className={style.actions}>
                  {editingUser?.id === u.id ? (
                    <>
                      <button onClick={saveEditing}>Save</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(u)}>Edit</button>
                      <button onClick={() => handleDelete(u.id)}>Delete</button>
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