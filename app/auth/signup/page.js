"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth/signup.module.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("users").insert({
        email,
        name: email.split("@")[0],
        role_id: 7,
      });

      setMessage("Signup successful! Please check your email before logging in.");

      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: email.split("@")[0] }),
      }).catch(console.error);

      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.signupCard}>
        <h1 className={styles.title}>Sign Up</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.inputField}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.inputField}
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className={styles.signupButton}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {message && <p className={styles.message}>{message}</p>}

        {message && (
          <button
            onClick={() => router.push("/auth/login")}
            className={styles.goToLoginButton}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}