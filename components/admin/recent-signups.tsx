// components/admin/recent-signups.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentSignupsProps {
    operators: Array<{
        id: string;
        businessName: string;
        isApproved: boolean;
        createdAt: Date;
        user: {
            name: string | null;
            email: string | null;
        };
    }>;
}

export function RecentSignups({ operators }: RecentSignupsProps) {
    if (operators.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Signups (Last 24h)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No new signups in the last 24 hours</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Signups (Last 24h)</CardTitle>
                <Badge variant="secondary">{operators.length} new</Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {operators.map((operator) => (
                        <Link
                            key={operator.id}
                            href={`/admin/operators/${operator.id}`}
                            className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{operator.businessName}</p>
                                <p className="text-sm text-gray-500 truncate">{operator.user.name}</p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <Badge variant={operator.isApproved ? "default" : "secondary"}>
                                    {operator.isApproved ? "Approved" : "Pending"}
                                </Badge>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(operator.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <Button variant="ghost" asChild className="w-full">
                        <Link href="/admin/operators">
                            View All Operators
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}