// app/admin/dashboard/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAdminDashboardStats, getRecentSignups } from "@/actions/admin/dashboard";
import { UrgentActionCard } from "@/components/admin/urgent-action-card";
import { WeeklyStats } from "@/components/admin/weekly-stats";
import { RecentSignups } from "@/components/admin/recent-signups";

export const metadata: Metadata = {
  title: "Admin Dashboard | SA Tours",
  description: "Manage your tour platform",
};

export default async function AdminDashboardPage() {
  const user = await currentUser();

  if (!user || user.role !== "Admin") {
    redirect("/");
  }

  const [statsResult, signupsResult] = await Promise.all([
    getAdminDashboardStats(),
    getRecentSignups(),
  ]);

  if (!statsResult.success || !("data" in statsResult)) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
            <p className="text-gray-600">Failed to load dashboard data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const { urgentActions, weeklyStats } = statsResult.data;
  const operators =
    signupsResult.success && "data" in signupsResult ? signupsResult.data.operators : [];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}</p>
        </div>

        {/* Urgent Actions */}
        <UrgentActionCard urgentActions={urgentActions} />

        {/* Weekly Stats */}
        <WeeklyStats stats={weeklyStats} />

        {/* Recent Signups */}
        <RecentSignups operators={operators} />
      </div>
    </div>
  );
}