// components/admin/operators-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, UserRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Operator {
    id: string;
    businessName: string;
    isApproved: boolean;
    bankVerificationStatus: "Pending" | "Approved" | "Rejected" | null;
    createdAt: Date;
    verificationDocumentsSubmittedAt: Date | null;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

interface OperatorsTableProps {
    operators: Operator[];
    totalPages: number;
    currentPage: number;
}

export function OperatorsTable({ operators, totalPages, currentPage }: OperatorsTableProps) {
    const router = useRouter();

    const getStatusBadge = (operator: Operator) => {
        if (!operator.isApproved) {
            return (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pending Review
                </Badge>
            );
        }

        if (operator.bankVerificationStatus === "Pending") {
            return (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Bank Pending
                </Badge>
            );
        }

        if (operator.bankVerificationStatus === "Approved") {
            return (
                <Badge variant="default" className="bg-green-600">
                    Approved
                </Badge>
            );
        }

        if (operator.bankVerificationStatus === "Rejected") {
            return (
                <Badge variant="destructive">
                    Rejected
                </Badge>
            );
        }

        return <Badge variant="secondary">Unknown</Badge>;
    };

    if (operators.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-gray-600">No operators found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Operator</TableHead>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {operators.map((operator) => (
                                <TableRow key={operator.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={operator.user.image || ""} />
                                                <AvatarFallback>
                                                    <UserRound className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{operator.user.name || "Unknown"}</p>
                                                <p className="text-sm text-muted-foreground">{operator.user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{operator.businessName}</TableCell>
                                    <TableCell>{getStatusBadge(operator)}</TableCell>
                                    <TableCell>
                                        {operator.verificationDocumentsSubmittedAt
                                            ? formatDistanceToNow(new Date(operator.verificationDocumentsSubmittedAt), {
                                                addSuffix: true,
                                            })
                                            : formatDistanceToNow(new Date(operator.createdAt), {
                                                addSuffix: true,
                                            })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/operators/${operator.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => router.push(`/admin/operators?page=${page}`)}
                        >
                            {page}
                        </Button>
                    ))}
                </div>
            )}
        </>
    );
}