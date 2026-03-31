"use client";

import { useEffect, useState } from "react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/get-tickets?status=${filterStatus}`);
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
      else throw new Error(data.error);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!replyMessage || !selectedTicket) return;

    try {
      const res = await fetch("/api/admin/reply-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          admin_id: 1, // replace with actual admin ID
          message: replyMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReplyMessage("");
      alert("Reply sent!");
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to send reply");
    }
  }

  async function updateStatus(ticketId, status) {
    try {
      const res = await fetch("/api/admin/update-ticket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update status");
    }
  }

  if (loading) return <p className="p-6">Loading tickets...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Support & Feedback</h1>

      {/* Filter */}
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="border p-2 rounded mb-4"
      >
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* Ticket List */}
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">User</th>
            <th className="border px-4 py-2">Subject</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr><td colSpan="5" className="text-center py-4">No tickets</td></tr>
          ) : tickets.map((t, idx) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">{t.users?.name || t.users?.email}</td>
              <td className="border px-4 py-2">{t.subject}</td>
              <td className="border px-4 py-2 capitalize">{t.status}</td>
              <td className="border px-4 py-2 flex gap-2">
                <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={() => setSelectedTicket(t)}>View</button>
                {t.status !== "resolved" && <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => updateStatus(t.id, "resolved")}>Resolve</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ticket Details */}
      {selectedTicket && (
        <div className="bg-white p-4 rounded shadow mt-4 space-y-3">
          <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
          <p><strong>User:</strong> {selectedTicket.users?.name} ({selectedTicket.users?.email})</p>
          <p><strong>Message:</strong> {selectedTicket.message}</p>
          <p><strong>Status:</strong> {selectedTicket.status}</p>

          <textarea
            placeholder="Write a reply..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleReply}>Send Reply</button>
            <button className="px-3 py-1 bg-gray-500 text-white rounded" onClick={() => setSelectedTicket(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}