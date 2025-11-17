// components/admin/weekly-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, MessageSquareQuote, CheckCircle2 } from "lucide-react";

interface WeeklyStatsProps {
    stats: {
        newOperators: number;
        newTours: number;
        newQuotes: number;
        confirmedBookings: number;
    };
}

export function WeeklyStats({ stats }: WeeklyStatsProps) {
    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* New Operators */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">New Operators</CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.newOperators}</div>
                        <p className="text-xs text-gray-500 mt-1">Signups</p>
                    </CardContent>
                </Card>

                {/* New Tours */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">New Tours</CardTitle>
                        <MapPin className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.newTours}</div>
                        <p className="text-xs text-gray-500 mt-1">Created</p>
                    </CardContent>
                </Card>

                {/* Quote Requests */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Quotes</CardTitle>
                        <MessageSquareQuote className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.newQuotes}</div>
                        <p className="text-xs text-gray-500 mt-1">Requested</p>
                    </CardContent>
                </Card>

                {/* Confirmed Bookings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Bookings</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.confirmedBookings}</div>
                        <p className="text-xs text-gray-500 mt-1">Confirmed</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}