"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    // 1️⃣ Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return alert(authError.message);

    // 2️⃣ Fetch user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role_id")
      .eq("email", email)
      .single();

    if (profileError || !userProfile) return alert("Failed to fetch user profile.");

   
      router.push("/dashboard"); // Normal user dashboard
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="p-8 bg-white dark:bg-zinc-900 rounded shadow w-96">
        <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Login</h1>
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
          onClick={handleLogin}
          className="w-full p-2 bg-black text-white rounded hover:bg-zinc-800"
        >
          Login
        </button>
      </div>
    </div>
  );
}