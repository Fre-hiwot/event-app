"use client";
import RoleBasedDashboard from "../../components/RoleBasedDashboard";

export default function DashboardPage() {
  return (
    <RoleBasedDashboard>
      <h1 className="text-3xl font-bold mb-6">Welcome to your Dashboard</h1>
      <p>Select a section from the sidebar to start managing or exploring.</p>
    </RoleBasedDashboard>
  );
}