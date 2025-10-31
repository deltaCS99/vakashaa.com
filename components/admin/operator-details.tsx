// components/admin/operator-details.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
    CheckCircle,
    XCircle,
    Trash2,
    Mail,
    Phone,
    MessageSquare,
    MapPin,
    Calendar,
    UserRound,
    Pencil,
} from "lucide-react";
import { format } from "date-fns";
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
            return "Inbound (International tourists to SA)";
        case "Domestic":
            return "Domestic (SA residents within SA)";
        case "Outbound":
            return "Outbound (SA residents abroad)";
        case "All":
            return "All Services";
    }
};

interface OperatorDetailsProps {
    operator: {
        id: string;
        businessName: string;
        businessPhone: string | null;
        businessWhatsApp: string | null;
        description: string | null;
        operatorType: "TourOperator" | "DMC";
        serviceType: "Inbound" | "Domestic" | "Outbound" | "All";
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        user: {
            id: string;
            name: string | null;
            email: string | null;
            image: string | null;
            createdAt: Date;
        };
        tours: {
            id: string;
            title: string;
            isActive: boolean;
            createdAt: Date;
        }[];
    };
}

export function OperatorDetails({ operator }: OperatorDetailsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        const result = await approveOperator(operator.id);
        setLoading(false);

        if (result.success) {
            toast.success("Operator approved successfully");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to approve operator");
        }
    };

    const handleReject = async () => {
        setLoading(true);
        const result = await rejectOperator(operator.id);
        setLoading(false);

        if (result.success) {
            toast.success("Operator approval revoked");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to update operator");
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteOperator(operator.id);
        setLoading(false);
        setDeleteDialog(false);

        if (result.success) {
            toast.success("Operator deleted successfully");
            router.push("/admin/operators");
        } else {
            toast.error(result.error?.message || "Failed to delete operator");
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={operator.user.image || ""} />
                                    <AvatarFallback>
                                        <UserRound className="h-10 w-10" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl font-bold">{operator.businessName}</h1>
                                    <p className="text-muted-foreground">{operator.user.name}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge
                                            variant={operator.isApproved ? "default" : "secondary"}
                                        >
                                            {operator.isApproved ? "Approved" : "Pending Approval"}
                                        </Badge>
                                        <Badge variant="outline">{getOperatorTypeLabel(operator.operatorType)}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setEditDialog(true)}
                                    disabled={loading}
                                    variant="outline"
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                {!operator.isApproved ? (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleReject}
                                        disabled={loading}
                                        variant="outline"
                                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Revoke
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setDeleteDialog(true)}
                                    disabled={loading || operator.tours.length > 0}
                                    variant="destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{operator.user.email || "Not provided"}</p>
                                </div>
                            </div>
                            {operator.businessPhone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Business Phone</p>
                                        <p className="font-medium">{operator.businessPhone}</p>
                                    </div>
                                </div>
                            )}
                            {operator.businessWhatsApp && (
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                                        <p className="font-medium">{operator.businessWhatsApp}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <UserRound className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Operator Type</p>
                                    <p className="font-medium">{getOperatorTypeLabel(operator.operatorType)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Service Type</p>
                                    <p className="font-medium">{getServiceTypeLabel(operator.serviceType)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Applied</p>
                                    <p className="font-medium">
                                        {format(new Date(operator.createdAt), "PPP")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">User Joined</p>
                                    <p className="font-medium">
                                        {format(new Date(operator.user.createdAt), "PPP")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Tours</p>
                                    <p className="font-medium">{operator.tours.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Description */}
                {operator.description && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {operator.description}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Tours */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tours ({operator.tours.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {operator.tours.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No tours created yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {operator.tours.map((tour) => (
                                    <Link
                                        key={tour.id}
                                        href={`/admin/tours/${tour.id}`}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium">{tour.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Created {format(new Date(tour.createdAt), "PPP")}
                                            </p>
                                        </div>
                                        <Badge variant={tour.isActive ? "default" : "secondary"}>
                                            {tour.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Operator</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this operator? This action cannot be undone.
                            {operator.tours.length > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                    This operator has {operator.tours.length} tour(s) and cannot be deleted.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={operator.tours.length > 0}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <EditOperatorDialog
                operator={operator}
                open={editDialog}
                onOpenChange={setEditDialog}
            />
        </>
    );
}