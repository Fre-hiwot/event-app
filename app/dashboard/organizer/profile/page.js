"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import style from "../../../styles/dashboard/organizer/profile.module.css";

export default function OrganizerProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userAuthId, setUserAuthId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in");
      return;
    }

    setUserAuthId(user.id);

    const { data, error } = await supabase
      .from("users")
      .select("name,email,phone")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.log("Fetch error:", error);
    } else {
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
    }

    setLoading(false);
  };

  const updateProfile = async () => {
    if (!userAuthId) return alert("User not logged in");

    try {
      // 1️⃣ Update Supabase Auth (email)
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        email,
      });

      if (authError) {
        console.log("Auth update error:", authError);
        return alert("Failed to update email: " + authError.message);
      }

      // 2️⃣ Update users table (name, phone, email)
      const { error: tableError } = await supabase
        .from("users")
        .update({ name, phone, email })
        .eq("auth_id", userAuthId);

      if (tableError) {
        console.log("Table update error:", tableError);
        return alert("Failed to update profile info");
      }

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Unexpected error while updating profile");
    }
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword)
      return alert("Fill all password fields");

    if (newPassword !== confirmPassword)
      return alert("Passwords do not match");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("User not logged in");

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (verifyError) return alert("Old password is incorrect");

      await supabase.auth.refreshSession();

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.log(updateError);
        return alert("Failed to update password: " + updateError.message);
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("Password updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    }
  };

  if (loading) {
    return <p className={style["organizer-profile-loading"]}>Loading profile...</p>;
  }

  return (
    <div className={style["organizer-profile-container"]}>
      <h1 className={style["organizer-profile-title"]}>Organizer Profile</h1>

      <div className={style["organizer-profile-form"]}>

        {/* Profile Info */}
        <div className={style["profile-section"]}>
          <label className={style["profile-label"]}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={style["profile-input"]}
          />
        </div>

        <div className={style["profile-section"]}>
          <label className={style["profile-label"]}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Now editable
            className={style["profile-input"]}
          />
        </div>

        <div className={style["profile-section"]}>
          <label className={style["profile-label"]}>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={style["profile-input"]}
          />
        </div>

        <button
          onClick={updateProfile}
          className={`${style["profile-button"]} ${style["profile-button-update"]}`}
        >
          Update Profile
        </button>

        {/* Password Section */}
        <div className={style["password-section"]}>
          <h2 className={style["password-title"]}>Change Password</h2>

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className={style["password-input"]}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={style["password-input"]}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={style["password-input"]}
          />

          <button
            onClick={changePassword}
            className={`${style["profile-button"]} ${style["profile-button-password"]}`}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}