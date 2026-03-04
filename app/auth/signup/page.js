"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    // Default role = user (id 7)
    if (data.user) {
      await supabase.from("users").insert({
        email,
        role_id: 7,
        name: email.split("@")[0],
      });
    }
    alert("Signup successful! Please verify your email.");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="p-8 bg-white dark:bg-zinc-900 rounded shadow w-96">
        <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Sign Up</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <button onClick={handleSignup} className="w-full p-2 bg-black text-white rounded hover:bg-zinc-800">Sign Up</button>
      </div>
    </div>
  );
}