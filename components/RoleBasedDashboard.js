"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../styles/dashboard/roleDashboard.module.css";
import {
  Home,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Info,
  Phone,
  Folder,
} from "lucide-react";

export default function RoleBasedDashboard({ children }) {
  const [profile, setProfile] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  // ✅ FIXED ACTIVE LOGIC
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData, error } = await supabase
      .from("users")
      .select("id, name, role_id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) console.error("Profile fetch error:", error);
    else setProfile(profileData);
  }

  if (!profile) return <p>Loading dashboard...</p>;

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div
          className={styles.sidebarBanner}
          style={{ backgroundImage: "url('/images/dashboard.jpg')" }}
        ></div>

        <h2 className={styles.sidebarTitle}>Dashboard</h2>
        <p className={styles.sidebarGreeting}>Hello, {profile.name}</p>

        <nav className={styles.sidebarNav}>
          {/* Admin */}
          {profile.role_id === 5 && (
            <>
              <Link
                href="/dashboard/admin/overview"
                className={`${styles.navLink} ${
                  isActive("/dashboard/admin/overview") ? styles.activeLink : ""
                }`}
              >
                <Home size={18} className={styles.navIcon} /> Dashboard Overview
              </Link>

              <Link
                href="/dashboard/admin/audit"
                className={`${styles.navLink} ${
                  isActive("/dashboard/admin/audit") ? styles.activeLink : ""
                }`}
              >
                <FileText size={18} className={styles.navIcon} /> Audit & Logs
              </Link>

              <Link
                href="/bookings"
                className={`${styles.navLink} ${
                  isActive("/bookings") ? styles.activeLink : ""
                }`}
              >
                <Calendar size={18} className={styles.navIcon} /> Booking & Transactions
              </Link>

              <Link
                href="/category"
                className={`${styles.navLink} ${
                  isActive("/category") ? styles.activeLink : ""
                }`}
              >
                <Folder size={18} className={styles.navIcon} /> Event & Category Management
              </Link>

              <Link
                href="/dashboard/featuredEvent"
                className={`${styles.navLink} ${
                  isActive("/dashboard/featuredEvent") ? styles.activeLink : ""
                }`}
              >
                <Calendar size={18} className={styles.navIcon} /> Manage Featured Events
              </Link>

              <Link
                href="/dashboard/admin/users"
                className={`${styles.navLink} ${
                  isActive("/dashboard/admin/users") ? styles.activeLink : ""
                }`}
              >
                <Users size={18} className={styles.navIcon} /> User & Role Management
              </Link>

              <Link
                href="/payments"
                className={`${styles.navLink} ${
                  isActive("/payments") ? styles.activeLink : ""
                }`}
              >
                <CreditCard size={18} className={styles.navIcon} /> Payment History
              </Link>

              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={styles.settingsButton}
              >
                <Settings size={18} className={styles.navIcon} /> Settings{" "}
                <span>{settingsOpen ? "▲" : "▼"}</span>
              </button>

              {settingsOpen && (
                <div className={styles.settingsItems}>
                  <Link
                    href="/dashboard/admin/profile"
                    className={`${styles.navLink} ${
                      isActive("/dashboard/admin/profile") ? styles.activeLink : ""
                    }`}
                  >
                    <Users size={16} className={styles.navIcon} /> Profile & Account
                  </Link>

                  <Link
                    href="/dashboard/admin/support"
                    className={`${styles.navLink} ${
                      isActive("/dashboard/admin/support") ? styles.activeLink : ""
                    }`}
                  >
                    <Phone size={16} className={styles.navIcon} /> Support & Feedback
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Organizer */}
          {profile.role_id === 6 && (
            <>
              <Link
                href="/category"
                className={`${styles.navLink} ${
                  isActive("/category") ? styles.activeLink : ""
                }`}
              >
                <Folder size={18} className={styles.navIcon} /> My Events & Categories
              </Link>

              <Link
                href="/bookings"
                className={`${styles.navLink} ${
                  isActive("/bookings") ? styles.activeLink : ""
                }`}
              >
                <Calendar size={18} className={styles.navIcon} /> My Bookings
              </Link>


              {/* ✅ New: Featured Events Management */}
              <Link
                href="/dashboard/featuredEvent"
                className={`${styles.navLink} ${
                  isActive("/dashboard/featuredEvent") ? styles.activeLink : ""
                }`}
              >
                <Calendar size={18} className={styles.navIcon} /> Manage Featured Events
              </Link>

              <Link
                href="/payments"
                className={`${styles.navLink} ${
                  isActive("/payments") ? styles.activeLink : ""
                }`}
              >
                <CreditCard size={18} className={styles.navIcon} /> Payment History
              </Link>

              <Link
                href="/dashboard/organizer/profile"
                className={`${styles.navLink} ${
                  isActive("/dashboard/organizer/profile") ? styles.activeLink : ""
                }`}
              >
                <Users size={18} className={styles.navIcon} /> My Profile
              </Link>
            </>
          )}

          {/* User */}
          {profile.role_id === 7 && (
            <>
              <Link
                href="/dashboard/user"
                className={`${styles.navLink} ${
                  isActive("/dashboard/user") ? styles.activeLink : ""
                }`}
              >
                <Home size={18} className={styles.navIcon} /> Browse Events
              </Link>

              <Link
                href="/bookings"
                className={`${styles.navLink} ${
                  isActive("/bookings") ? styles.activeLink : ""
                }`}
              >
                <Calendar size={18} className={styles.navIcon} /> My Bookings
              </Link>

              <Link
                href="/payments"
                className={`${styles.navLink} ${
                  isActive("/payments") ? styles.activeLink : ""
                }`}
              >
                <CreditCard size={18} className={styles.navIcon} /> Payment History
              </Link>

              <Link
                href="/dashboard/user/profile"
                className={`${styles.navLink} ${
                  isActive("/dashboard/user/profile") ? styles.activeLink : ""
                }`}
              >
                <Users size={18} className={styles.navIcon} /> My Profile
              </Link>

              <Link
                href="/about"
                className={`${styles.navLink} ${
                  isActive("/about") ? styles.activeLink : ""
                }`}
              >
                <Info size={18} className={styles.navIcon} /> About
              </Link>

              <Link
                href="/contact"
                className={`${styles.navLink} ${
                  isActive("/contact") ? styles.activeLink : ""
                }`}
              >
                <Phone size={18} className={styles.navIcon} /> Contact
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}