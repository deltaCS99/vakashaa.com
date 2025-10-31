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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, CheckCircle, XCircle, Eye, Trash2, UserRound, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { approveOperator, rejectOperator, deleteOperator } from "@/actions/admin/operators";
import { toast } from "sonner";
import { EditOperatorDialog } from "./edit-operator-dialog";

const getOperatorTypeLabel = (type: "TourOperator" | "DMC") => {
    return type === "TourOperator" ? "Tour Operator" : "DMC";
};

const getServiceTypeLabel = (type: "Inbound" | "Domestic" | "Outbound" | "All") => {
    switch (type) {
        case "Inbound":
            return "Inbound (Intl to SA)";
        case "Domestic":
            return "Domestic (SA only)";
        case "Outbound":
            return "Outbound (SA abroad)";
        case "All":
            return "All Services";
    }
};

interface Operator {
    id: string;
    businessName: string;
    businessPhone: string | null;
    businessWhatsApp: string | null;
    description: string | null;
    operatorType: "TourOperator" | "DMC";
    serviceType: "Inbound" | "Domestic" | "Outbound" | "All";
    isApproved: boolean;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    _count: {
        tours: number;
    };
}

interface OperatorsTableProps {
    operators: Operator[];
    totalPages: number;
    currentPage: number;
}

export function OperatorsTable({ operators, totalPages, currentPage }: OperatorsTableProps) {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
    const [editOperator, setEditOperator] = useState<Operator | null>(null);

    const handleApprove = async (operatorId: string) => {
        setActionLoading(operatorId);
        const result = await approveOperator(operatorId);
        setActionLoading(null);

        if (result.success) {
            toast.success("Operator approved successfully");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to approve operator");
        }
    };

    const handleReject = async (operatorId: string) => {
        setActionLoading(operatorId);
        const result = await rejectOperator(operatorId);
        setActionLoading(null);

        if (result.success) {
            toast.success("Operator status updated");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to update operator");
        }
    };

    const handleDelete = async (operatorId: string) => {
        setActionLoading(operatorId);
        const result = await deleteOperator(operatorId);
        setActionLoading(null);
        setDeleteDialog(null);

        if (result.success) {
            toast.success("Operator deleted successfully");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to delete operator");
        }
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
                                <TableHead>Business</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tours</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                                <p className="text-sm text-muted-foreground">
                                                    {operator.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{operator.businessName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{getOperatorTypeLabel(operator.operatorType)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={operator.isApproved ? "default" : "secondary"}>
                                            {operator.isApproved ? "Approved" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{operator._count.tours}</TableCell>
                                    <TableCell>
                                        {formatDistanceToNow(new Date(operator.createdAt), {
                                            addSuffix: true,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={actionLoading === operator.id}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/operators/${operator.id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setEditOperator(operator)}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {!operator.isApproved ? (
                                                    <DropdownMenuItem
                                                        onClick={() => handleApprove(operator.id)}
                                                        className="text-green-600"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleReject(operator.id)}
                                                        className="text-orange-600"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Revoke Approval
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteDialog(operator.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Operator</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this operator? This action cannot be undone.
                            The operator must have no tours to be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteDialog && handleDelete(deleteDialog)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Operator Dialog */}
            {editOperator && (
                <EditOperatorDialog
                    operator={editOperator}
                    open={!!editOperator}
                    onOpenChange={(open) => !open && setEditOperator(null)}
                />
            )}
        </>
    );
}