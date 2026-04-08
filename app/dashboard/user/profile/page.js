"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import style from "../../../styles/dashboard/user/profile.module.css";

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
    <div className={style.profileContainer}>
      <h1 className={style.profileHeading}>My Profile</h1>

      {/* Name */}
      <label className={style.profileLabel}>Name</label>
      <input
        type="text"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        className={style.profileInput}
      />

      {/* Email */}
      <label className={style.profileLabel}>Email</label>
      <input
        type="email"
        value={profile.email}
        disabled
        className={`${style.profileInput} ${style.profileInputDisabled}`}
      />

      {/* Phone */}
      <label className={style.profileLabel}>Phone</label>
      <input
        type="text"
        value={profile.phone}
        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        className={style.profileInput}
      />

      <h2 className={style.profileSubheading}>Payment Method</h2>
      <select
        value={profile.payment_method}
        onChange={(e) => setProfile({ ...profile, payment_method: e.target.value })}
        className={style.profileSelect}
      >
        <option value="">Select Payment Method</option>
        <option value="card">Credit/Debit Card</option>
        <option value="telebirr">Telebirr</option>
        <option value="bank">Bank Transfer</option>
      </select>

      {/* Card Details */}
      <input
        type="text"
        placeholder="Card Holder Name"
        value={profile.card_name}
        onChange={(e) => setProfile({ ...profile, card_name: e.target.value })}
        className={style.profileInput}
      />
      <input
        type="text"
        placeholder="Card Number"
        value={profile.card_number}
        onChange={(e) => setProfile({ ...profile, card_number: e.target.value })}
        className={style.profileInput}
      />
      <input
        type="text"
        placeholder="Expiry Date (MM/YY)"
        value={profile.card_expiry}
        onChange={(e) => setProfile({ ...profile, card_expiry: e.target.value })}
        className={style.profileInput}
      />
      <input
        type="password"
        placeholder="CVV"
        value={profile.card_cvv}
        onChange={(e) => setProfile({ ...profile, card_cvv: e.target.value })}
        className={style.profileInput}
      />

      <button onClick={updateProfile} className={style.profileButton}>
        Update Profile
      </button>
    </div>
  );
}