"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // message shown to user
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    setMessage(""); // clear previous message

    // 1️⃣ Sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2️⃣ Insert profile info in your users table
      await supabase.from("users").insert({
        // id: data.user.id,
        email,
        name: email.split("@")[0],
        role_id: 7,
      });

      // 3️⃣ Show message to the user first
      setMessage("Signup successful! Please check your email before logging in.");

      // 4️⃣ Send welcome email in background
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: email.split("@")[0] }),
      }).catch(console.error);

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="p-8 bg-white dark:bg-zinc-900 rounded shadow w-96">
        <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Sign Up</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full p-2 bg-black text-white rounded hover:bg-zinc-800"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {message && <p className="mt-4 text-center text-green-600">{message}</p>}

        {/* Optional: link to login page after signup */}
        {message && (
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-4 w-full p-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}