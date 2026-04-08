"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // adjust path
import styles from "./contact.module.css";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Save the message to the "feedback" table in Supabase
    const { error } = await supabase.from("feedback").insert([
      {
        name,
        email,
        message,
        created_at: new Date()
      }
    ]);

    if (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } else {
      alert("Message sent successfully!");
      // Clear form
      setName("");
      setEmail("");
      setMessage("");
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Contact Us</h1>

      <p className={styles.text}>
        Have questions or feedback? We'd love to hear from you! Fill out the form below or reach us via email or phone.
      </p>

      <section className={styles.section}>
        <h2>Our Contact Info</h2>
        <p>Email: support@eventapp.com</p>
        <p>Phone: +251 912 345 678</p>
        <p>Address: Addis Ababa, Ethiopia</p>
      </section>

      <section className={styles.section}>
        <h2>Send Us a Message</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Message
            <textarea
              placeholder="Your message"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </div>
  );
}