// components/admin/urgent-action-card.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UrgentActionCardProps {
    urgentActions: {
        pendingOperators: number;
        pendingBankVerifications: number;
        total: number;
    };
}

export function UrgentActionCard({ urgentActions }: UrgentActionCardProps) {
    const { pendingOperators, pendingBankVerifications, total } = urgentActions;

    // All caught up state
    if (total === 0) {
        return (
            <Card className="mb-8 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-green-900 mb-2">All Caught Up! 🎉</h2>
                            <p className="text-green-700 mb-6">
                                No pending actions. Your platform is running smoothly.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" asChild className="bg-white">
                                    <Link href="/admin/operators">View All Operators</Link>
                                </Button>
                                <Button variant="outline" asChild className="bg-white">
                                    <Link href="/admin/tours">View All Tours</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Urgent actions needed
    return (
        <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-full">
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-orange-900 mb-2">
                            {total} {total === 1 ? "Action" : "Actions"} Required
                        </h2>
                        <p className="text-orange-700 mb-6">
                            Items waiting for your review and approval
                        </p>

                        <div className="space-y-3">
                            {pendingOperators > 0 && (
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {pendingOperators} {pendingOperators === 1 ? "Operator" : "Operators"}{" "}
                                            Awaiting Approval
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Review verification documents and approve accounts
                                        </p>
                                    </div>
                                    <Button asChild className="bg-orange-600 hover:bg-orange-700">
                                        <Link href="/admin/operators?status=pending">
                                            Review Now
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            {pendingBankVerifications > 0 && (
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {pendingBankVerifications} Bank{" "}
                                            {pendingBankVerifications === 1 ? "Account" : "Accounts"} Pending
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Verify bank details for approved operators
                                        </p>
                                    </div>
                                    <Button asChild className="bg-orange-600 hover:bg-orange-700">
                                        <Link href="/admin/operators?status=bank_pending">
                                            Verify Now
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}