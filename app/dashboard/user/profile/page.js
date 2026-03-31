"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function UserProfile() {

  const [userId, setUserId] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    payment_method: "",
    card_name: "",
    card_number: "",
    card_expiry: "",
    card_cvv: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setUserId(data.id);

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        payment_method: data.payment_method || "",
        card_name: data.card_name || "",
        card_number: data.card_number || "",
        card_expiry: data.card_expiry || "",
        card_cvv: data.card_cvv || ""
      });
    }
  }

  async function updateProfile() {

    const { error } = await supabase
      .from("users")
      .update(profile)
      .eq("id", userId);

    if (error) {
      console.error(error);
      alert("Profile update failed");
    } else {
      alert("Profile updated successfully!");
    }
  }

  return (
    <div className="p-6 max-w-lg">

      <h1 className="text-2xl font-bold mb-6">
        My Profile
      </h1>

      {/* Name */}
      <label className="font-semibold">Name</label>
      <input
        type="text"
        value={profile.name}
        onChange={(e) =>
          setProfile({ ...profile, name: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      />

      {/* Email */}
      <label className="font-semibold">Email</label>
      <input
        type="email"
        value={profile.email}
        disabled
        className="w-full border p-2 rounded mb-4 bg-gray-100"
      />

      {/* Phone */}
      <label className="font-semibold">Phone</label>
      <input
        type="text"
        value={profile.phone}
        onChange={(e) =>
          setProfile({ ...profile, phone: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      />

      <h2 className="text-xl font-bold mt-6 mb-4">
        Payment Method
      </h2>

      {/* Payment Method */}
      <select
        value={profile.payment_method}
        onChange={(e) =>
          setProfile({ ...profile, payment_method: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">Select Payment Method</option>
        <option value="card">Credit/Debit Card</option>
        <option value="telebirr">Telebirr</option>
        <option value="bank">Bank Transfer</option>
      </select>

      {/* Card Name */}
      <input
        type="text"
        placeholder="Card Holder Name"
        value={profile.card_name}
        onChange={(e) =>
          setProfile({ ...profile, card_name: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      />

      {/* Card Number */}
      <input
        type="text"
        placeholder="Card Number"
        value={profile.card_number}
        onChange={(e) =>
          setProfile({ ...profile, card_number: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      />

      {/* Expiry */}
      <input
        type="text"
        placeholder="Expiry Date (MM/YY)"
        value={profile.card_expiry}
        onChange={(e) =>
          setProfile({ ...profile, card_expiry: e.target.value })
        }
        className="w-full border p-2 rounded mb-4"
      />

      {/* CVV */}
      <input
        type="password"
        placeholder="CVV"
        value={profile.card_cvv}
        onChange={(e) =>
          setProfile({ ...profile, card_cvv: e.target.value })
        }
        className="w-full border p-2 rounded mb-6"
      />

      <button
        onClick={updateProfile}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Update Profile
      </button>

    </div>
  );
}