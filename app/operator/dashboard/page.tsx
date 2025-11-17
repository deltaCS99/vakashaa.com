// app/operator/dashboard/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile, getOperatorProfiles, getOperatorStatus } from "@/lib/operator";
import { getOperatorDashboardStats } from "@/actions/operator/dashboard";
import { OperatorStatusBanner } from "@/components/operator/operator-status-banner";
import { OperatorBusinessSwitcher } from "@/components/operator/operator-business-switcher";
import { OperatorDashboardStats } from "@/components/operator/operator-dashboard-stats";
import { OperatorRecentQuotes } from "@/components/operator/operator-recent-quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquareQuote, Package, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Dashboard | SA Tours Operator",
    description: "Operator dashboard overview",
};

interface PageProps {
    searchParams: {
        business?: string;
    };
}

export default async function OperatorDashboardPage({ searchParams }: PageProps) {
    const user = await currentUser();

    if (!user || user.role !== "Operator") {
        redirect("/login");
    }

    // Get all profiles and current profile
    const allProfiles = await getOperatorProfiles();
    const currentProfile = await getOperatorProfile(searchParams.business);

    if (!currentProfile) {
        redirect("/operator/apply");
    }

    // Fetch dashboard stats
    const result = await getOperatorDashboardStats(searchParams.business);

    if (!result.success || !("data" in result)) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
                    <p className="text-gray-600">
                        {!result.success && "error" in result
                            ? result.error.message
                            : "Failed to load dashboard. Please try again."}
                    </p>
                </div>
            </div>
        );
    }

    const { stats, recentQuotes } = result.data;
    const status = getOperatorStatus(currentProfile);

    // Determine what to show based on status
    const isLive = status === "live";
    const canReceiveQuotes = isLive;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header with Business Switcher */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                        <p className="text-gray-600">
                            {status === "draft" && "Create tours and complete verification to go live"}
                            {status === "pending_review" && "Your verification is being reviewed"}
                            {status === "live" && "Here's what's happening with your tours"}
                        </p>
                    </div>
                    <OperatorBusinessSwitcher
                        profiles={allProfiles}
                        currentProfileId={currentProfile.id}
                    />
                </div>

                {/* Status Banner */}
                <OperatorStatusBanner profile={currentProfile} />

                {/* Conditional Stats Based on Status */}
                {!isLive ? (
                    // Limited Stats for Draft/Pending
                    <div className="grid gap-6 md:grid-cols-2 mb-8">
                        {/* Total Tours - Always show */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Total Tours
                                </CardTitle>
                                <Package className="w-4 h-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalTours}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.activeTours} active, {stats.inactiveTours} inactive
                                </p>
                                {status === "draft" && stats.totalTours === 0 && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        Create tours now - they&apos;ll go live once verified
                                    </p>
                                )}
                                {status === "pending_review" && stats.totalTours > 0 && (
                                    <p className="text-xs text-yellow-600 mt-2">
                                        Tours will go live once verified
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quote Requests - Disabled */}
                        <Card className="opacity-60">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Quote Requests
                                </CardTitle>
                                <MessageSquareQuote className="w-4 h-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {status === "draft" && "Available after verification"}
                                    {status === "pending_review" && "Available once approved"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-3">
                                <Link href="/operator/tours" className="flex-1 min-w-[200px]">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create New Tour
                                    </Button>
                                </Link>
                                {status === "draft" && (
                                    <Link href="/operator/settings?tab=verification" className="flex-1 min-w-[200px]">
                                        <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            Complete Verification
                                        </Button>
                                    </Link>
                                )}
                                {stats.totalTours > 0 && (
                                    <Link href="/operator/tours" className="flex-1 min-w-[200px]">
                                        <Button variant="outline" className="w-full justify-start">
                                            <Package className="w-4 h-4 mr-2" />
                                            View My Tours
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Full Stats for Live
                    <OperatorDashboardStats stats={stats} />
                )}

                {/* What's Next Section - For pending review */}
                {status === "pending_review" && (
                    <Card className="mb-8 p-6">
                        <h3 className="text-lg font-semibold mb-4">What Happens Next?</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium">Admin Review</p>
                                    <p className="text-gray-600">
                                        We&apos;re reviewing your documents (typically 1-2 business days)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium">Tours Go Live</p>
                                    <p className="text-gray-600">
                                        Once approved, your {stats.totalTours} tour
                                        {stats.totalTours !== 1 ? "s" : ""} will become visible to customers
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium">Start Receiving Bookings</p>
                                    <p className="text-gray-600">
                                        You&apos;ll receive quote requests and bookings
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Recent Quote Requests - Only show if live */}
                {canReceiveQuotes && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">Recent Quote Requests</h2>
                        {recentQuotes.length > 0 ? (
                            <OperatorRecentQuotes quotes={recentQuotes} />
                        ) : (
                            <Card className="p-8 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <MessageSquareQuote className="w-12 h-12 text-gray-400" />
                                    <div>
                                        <h3 className="font-semibold mb-1">No Quote Requests Yet</h3>
                                        <p className="text-sm text-gray-600">
                                            Quote requests from customers will appear here
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}