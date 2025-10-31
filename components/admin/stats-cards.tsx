// components/admin/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, MessageSquareQuote, User, FileText, CheckCircle } from "lucide-react";

interface StatsCardsProps {
    stats: {
        operators: {
            total: number;
            pending: number;
            approved: number;
        };
        tours: {
            total: number;
            active: number;
        };
        quotes: {
            total: number;
            pending: number;
        };
        users: {
            total: number;
        };
        blog: {
            total: number;
            published: number;
        };
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Operators */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operators</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.operators.total}</div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {stats.operators.approved} Approved
                        </span>
                        <span className="flex items-center gap-1 text-orange-600">
                            {stats.operators.pending} Pending
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Tours */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tours</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.tours.total}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {stats.tours.active} active tours
                    </p>
                </CardContent>
            </Card>

            {/* Quote Requests */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quote Requests</CardTitle>
                    <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.quotes.total}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {stats.quotes.pending} pending responses
                    </p>
                </CardContent>
            </Card>

            {/* Users */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.users.total}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Registered users
                    </p>
                </CardContent>
            </Card>

            {/* Blog Posts */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.blog.total}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {stats.blog.published} published
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}