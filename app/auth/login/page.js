"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth/login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);

  const router = useRouter();

  // ================= LOGIN =================
  const handleLogin = async () => {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) return alert(authError.message);

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role_id")
      .eq("email", email)
      .single();

    if (profileError || !userProfile)
      return alert("Failed to fetch user profile.");

    router.push("/dashboard");
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email first.");

    setLoadingReset(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/auth/reset-password",
    });

    setLoadingReset(false);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Password reset link sent! Check your email.");
    }
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

        {/* 🔥 FORGOT PASSWORD */}
        <p
          className={styles.forgotPassword}
          onClick={handleForgotPassword}
        >
          {loadingReset ? "Sending..." : "Forgot Password?"}
        </p>

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