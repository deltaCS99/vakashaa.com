// app/admin/dashboard/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAdminDashboardStats, getRecentActivity } from "@/actions/admin/dashboard";
import { StatsCards } from "@/components/admin/stats-cards";
import { RecentActivity } from "@/components/admin/recent-activity";

export const metadata: Metadata = {
  title: "Admin Dashboard | SA Tours",
  description: "Manage your tour platform",
};

export default async function AdminDashboardPage() {
  const user = await currentUser();

  if (!user || user.role !== "Admin") {
    redirect("/");
  }

  const [statsResult, activityResult] = await Promise.all([
    getAdminDashboardStats(),
    getRecentActivity(),
  ]);

  const stats =
    statsResult.success && "data" in statsResult ? statsResult.data : null;

  const activity =
    activityResult.success && "data" in activityResult
      ? activityResult.data
      : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user.name}. Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Recent Activity */}
        {activity && (
          <div className="mt-8">
            <RecentActivity activity={activity} />
          </div>
        )}
      </div>
    </div>
  );
}