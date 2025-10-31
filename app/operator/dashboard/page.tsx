// app/operator/dashboard/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { getOperatorDashboardStats } from "@/actions/operator/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    MessageSquareQuote,
    AlertCircle,
    CheckCircle2,
    Plus,
    ArrowRight,
    TrendingUp,
    DollarSign,
} from "lucide-react";
import Link from "next/link";
import { OperatorRecentQuotes } from "@/components/operator/operator-recent-quotes";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
    title: "Dashboard | SA Tours Operator",
    description: "Operator dashboard overview",
};

export default async function OperatorDashboardPage() {
    const user = await currentUser();

    if (!user || user.role !== "Operator") {
        redirect("/login");
    }

    const operatorProfile = await getOperatorProfile();

    if (!operatorProfile) {
        redirect("/operator/setup");
    }

    if (!operatorProfile.isApproved) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Pending Approval</h1>
                    <p className="text-gray-600 mb-6">
                        Your operator profile is currently under review. You&apos;ll be notified once it&apos;s
                        approved and you can start managing tours and responding to quote requests.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <p className="text-sm text-blue-900">
                            <strong>What happens next?</strong>
                        </p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                            <li>Our team will review your profile and documentation</li>
                            <li>This typically takes 1-2 business days</li>
                            <li>You&apos;ll receive an email once approved</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch dashboard stats
    const result = await getOperatorDashboardStats();

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

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {operatorProfile.businessName}!
                    </h1>
                    <p className="text-gray-600">Here&apos;s what&apos;s happening with your tours</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {/* Total Tours */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Tours</CardTitle>
                            <Package className="w-4 h-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTours}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.activeTours} active, {stats.inactiveTours} inactive
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Quotes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Quote Requests</CardTitle>
                            <MessageSquareQuote className="w-4 h-4 text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
                            <p className="text-xs text-gray-500 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    {/* Pending Quotes */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Needs Response</CardTitle>
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pendingQuotes}</div>
                            <p className="text-xs text-gray-500 mt-1">Awaiting your quote</p>
                            {stats.pendingQuotes > 0 && (
                                <Link href="/operator/quotes">
                                    <Button variant="link" size="sm" className="px-0 mt-2 h-auto">
                                        Respond now <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Confirmed Bookings */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
                            <p className="text-xs text-gray-500 mt-1">Paid bookings</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Stats Row */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    {/* Quote Acceptance Rate */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Quote Acceptance Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.acceptedQuotes} of {stats.quotedQuotes} quotes accepted
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Revenue */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                                <div className="text-2xl font-bold">
                                    R{((stats.totalRevenue || 0) / 100).toLocaleString("en-ZA")}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">From confirmed bookings</p>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/operator/tours">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Tour
                                </Button>
                            </Link>
                            {stats.pendingQuotes > 0 && (
                                <Link href="/operator/quotes?status=Pending">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        View Pending ({stats.pendingQuotes})
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Quote Requests */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Recent Quote Requests</h2>
                        <Link href="/operator/quotes">
                            <Button variant="outline" size="sm">
                                View All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

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
            </div>
        </div>
    );
}