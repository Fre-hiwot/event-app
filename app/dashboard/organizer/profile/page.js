"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function OrganizerProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userAuthId, setUserAuthId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password states
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
    const { error } = await supabase
      .from("users")
      .update({ name, phone })
      .eq("auth_id", userAuthId);

    if (error) {
      console.log(error);
      alert("Profile update failed");
    } else {
      alert("Profile updated successfully");
    }
  };

  // ✅ FIXED PASSWORD FUNCTION
  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword)
      return alert("Fill all password fields");

    if (newPassword !== confirmPassword)
      return alert("Passwords do not match");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return alert("User not logged in");

      // Verify old password (without breaking session permanently)
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (verifyError) {
        return alert("Old password is incorrect");
      }

      // Refresh session (important)
      await supabase.auth.refreshSession();

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.log(updateError);
        return alert("Failed to update password: " + updateError.message);
      }

      // Clear inputs
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
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Organizer Profile</h1>

      <div className="space-y-4">

        {/* Profile Info */}
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          onClick={updateProfile}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Profile
        </button>

        {/* Password Section */}
        <div className="mt-6 border-t pt-4 space-y-2">
          <h2 className="text-xl font-semibold">Change Password</h2>

          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 w-full rounded"
          />

          <button
            onClick={changePassword}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}