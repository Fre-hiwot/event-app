"use client";

import { useEffect, useState } from "react";
import styles from "../../../styles/dashboard/admin/feedback.module.css";

export default function AdminFeedback() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/admin/feedback/get");
      if (!res.ok) throw new Error("Failed to fetch messages");

      const { feedback } = await res.json();
      setMessages(feedback || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>User Feedback</h1>

      {loading ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <p>No feedback messages yet.</p>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} className={styles.messageCard}>
              <p><strong>Name:</strong> {msg.name}</p>
              <p><strong>Email:</strong> {msg.email}</p>
              <p><strong>Message:</strong> {msg.message}</p>
              <p className={styles.timestamp}>
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}