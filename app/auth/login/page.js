"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth/login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return alert(authError.message);

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role_id")
      .eq("email", email)
      .single();

    if (profileError || !userProfile) return alert("Failed to fetch user profile.");

    router.push("/dashboard");
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Welcome Back!</h1>

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

        <button onClick={handleLogin} className={styles.loginButton}>
          Login
        </button>

        <p className={styles.signUpText}>
          Don't have an account? <a href="/auth/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}