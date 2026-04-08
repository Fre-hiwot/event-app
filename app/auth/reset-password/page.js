"use client"; // ✅ must be first line
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation"; // ✅ make sure this import is here
import styles from "../../styles/auth/reset.module.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter(); // ✅ define router here

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        alert("Invalid or expired reset link.");
      } else {
        setSessionReady(true);
      }
    };

    checkSession();
  }, []);

  const handleUpdate = async () => {
    if (!sessionReady) {
      return alert("Session not ready. Please use the reset link again.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match!");
    }

    if (password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully!");
      router.push("/auth/login"); // ✅ redirect works now
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Set New Password</h1>

      <input
        type="password"
        placeholder="New password"
        onChange={(e) => setPassword(e.target.value)}
        className={styles.Password}
      />

      <input
        type="password"
        placeholder="Confirm password"
        onChange={(e) => setConfirmPassword(e.target.value)}
        className={styles.Password}
      />

      <button onClick={handleUpdate} className={styles.button}>
        Update Password
      </button>
    </div>
  );
}