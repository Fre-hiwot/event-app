"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    profile_image_url: "",
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
  });

  const [payment, setPayment] = useState({
    last_method: "",
    total_spent: 0,
  });

  const [extras, setExtras] = useState({
    wishlist: [],
    recommended: [],
    loyalty_points: 0,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, name, email, phone, profile_image_url, role_id, created_at, email_notifications, sms_notifications, payment_method, total_spent, wishlist, recommended, loyalty_points"
      )
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
    } else if (data) {
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        profile_image_url: data.profile_image_url || "",
      });
      setPreferences({
        email_notifications: data.email_notifications ?? true,
        sms_notifications: data.sms_notifications ?? false,
      });
      setPayment({
        last_method: data.payment_method || "",
        total_spent: data.total_spent || 0,
      });
      setExtras({
        wishlist: data.wishlist || [],
        recommended: data.recommended || [],
        loyalty_points: data.loyalty_points || 0,
      });
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("User not found.");

    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          phone: formData.phone,
          profile_image_url: formData.profile_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_id", user.id)
        .select();

      if (error) throw error;

      setProfile(data[0]);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Error updating profile: " + err.message);
    }
  }

  async function updatePayment() {
    const newMethod = prompt("Enter new payment method:", payment.last_method);
    if (!newMethod) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ payment_method: newMethod })
        .eq("auth_id", user.id);

      if (error) throw error;

      setPayment({ ...payment, last_method: newMethod });
      alert("Payment method updated!");
    } catch (err) {
      console.error("Payment update error:", err);
      alert("Error updating payment method: " + err.message);
    }
  }

  async function updatePreferences() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
        })
        .eq("auth_id", user.id);

      if (error) throw error;

      alert("Preferences updated!");
    } catch (err) {
      console.error("Preferences update error:", err);
      alert("Error updating preferences: " + err.message);
    }
  }

  async function changePassword() {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Password change error:", error);
      alert("Error changing password: " + error.message);
    } else {
      alert("Password changed successfully!");
    }
  }

  async function updatePrivacy() {
    const visibility = prompt(
      "Enter profile visibility (public/private):",
      "public"
    );
    if (!visibility) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ profile_visibility: visibility })
        .eq("auth_id", user.id);

      if (error) throw error;

      alert("Privacy settings updated!");
    } catch (err) {
      console.error("Privacy update error:", err);
      alert("Error updating privacy: " + err.message);
    }
  }

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* Personal Information */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
        {editing ? (
          <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4">
            <label>
              Full Name:
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
            </label>
            <label>
              Phone Number:
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
            </label>
            <label>
              Profile Picture URL:
              <input
                type="text"
                value={formData.profile_image_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile_image_url: e.target.value,
                  })
                }
                className="border p-2 rounded w-full"
              />
            </label>
            {formData.profile_image_url && (
              <img
                src={formData.profile_image_url}
                alt="Profile"
                className="w-24 h-24 object-cover rounded mt-2"
              />
            )}
            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded shadow hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p>
              <strong>Full Name:</strong> {profile.name}
            </p>
            <p>
              <strong>Email:</strong> {profile.email}
            </p>
            <p>
              <strong>Phone:</strong> {profile.phone || "-"}
            </p>
            {profile.profile_image_url && (
              <img
                src={profile.profile_image_url}
                alt="Profile"
                className="w-24 h-24 object-cover rounded mt-2"
              />
            )}
            <button
              onClick={() => setEditing(true)}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
            >
              Edit Profile
            </button>
          </div>
        )}
      </section>

      {/* Account Details */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Account Details</h2>
        <p>User ID: {profile.id}</p>
        <p>Role ID: {profile.role_id}</p>
        <p>Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
      </section>

      {/* Payment Information */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Payment Information</h2>
        <p>Last Used Method: {payment.last_method}</p>
        <p>Total Spent: ${payment.total_spent}</p>
        <button
          onClick={updatePayment}
          className="mt-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
        >
          Update Payment Methods
        </button>
      </section>

      {/* Preferences / Settings */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Preferences & Settings</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.email_notifications}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                email_notifications: e.target.checked,
              })
            }
          />
          Email Notifications
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.sms_notifications}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                sms_notifications: e.target.checked,
              })
            }
          />
          SMS Notifications
        </label>
        <div className="mt-2 flex gap-2">
          <button
            onClick={updatePreferences}
            className="bg-purple-500 text-white px-4 py-2 rounded shadow hover:bg-purple-600"
          >
            Save Preferences
          </button>
          <button
            onClick={changePassword}
            className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
          >
            Change Password
          </button>
          <button
            onClick={updatePrivacy}
            className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600"
          >
            Privacy Settings
          </button>
        </div>
      </section>

    </div>
  );
}