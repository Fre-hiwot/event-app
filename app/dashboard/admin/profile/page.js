"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [lastLogin, setLastLogin] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  // ================= PROFILE =================
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLastLogin(user.last_sign_in_at);

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, phone, role_id, profile_image_url")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile(data);
      setName(data?.name || "");
      setEmail(data?.email || "");
      setPhone(data?.phone || "");
      setImageUrl(data?.profile_image_url || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE PROFILE =================
  const handleUpdate = async () => {
    if (!name || !email) return alert("Name and email are required");

    setUpdating(true);
    try {
      let uploadedUrl = imageUrl;

      // Upload image if changed
      if (image) {
        const fileName = `profile-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("profiles")
          .getPublicUrl(fileName);

        uploadedUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          name,
          email,
          phone,
          profile_image_url: uploadedUrl,
        })
        .eq("id", profile.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      setProfile(data);
      setImageUrl(uploadedUrl);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Enter new password");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("Error updating password");
    } else {
      alert("Password updated!");
      setNewPassword("");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">

      <h1 className="text-2xl font-bold">Admin Profile</h1>

      {/* Profile Image */}
      <div className="text-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-2 object-cover"
          />
        )}
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      </div>

      {/* Role */}
      <p className="text-sm text-gray-500">
        Role: <span className="font-semibold text-blue-600">Admin</span>
      </p>

      {/* Last Login */}
      <p className="text-sm text-gray-500">
        Last Login: {lastLogin ? new Date(lastLogin).toLocaleString() : "N/A"}
      </p>

      {/* Name */}
      <div>
        <label className="text-sm">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm">Phone Number</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Update Button */}
      <button
        onClick={handleUpdate}
        disabled={updating}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {updating ? "Updating..." : "Update Profile"}
      </button>

      {/* Change Password */}
      <div className="pt-4 border-t">
        <label className="text-sm">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border p-2 rounded mt-1"
        />
        <button
          onClick={handlePasswordChange}
          className="w-full mt-2 bg-green-600 text-white py-2 rounded"
        >
          Change Password
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-600 text-white py-2 rounded"
      >
        Logout
      </button>

    </div>
  );
}