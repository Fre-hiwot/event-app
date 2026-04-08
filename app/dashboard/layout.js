"use client";
import RoleBasedDashboard from "../../components/RoleBasedDashboard";
import styles from "../../STYLE/dashboard/roleDashboard.module.css";

export default function DashboardLayout({ children }) {
  return (
    <RoleBasedDashboard>
      <div className={styles.container}>
        {/* Dashboard content */}
        {children}
      
      </div>
    </RoleBasedDashboard>
  );
}