// components/admin/operator-details.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    MessageSquare,
    MapPin,
    Calendar,
    UserRound,
    FileText,
    ExternalLink,
    Building2,
    CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
    approveOperator,
    rejectOperator,
    approveBankDetails,
    rejectBankDetails,
} from "@/actions/admin/operators";
import { toast } from "sonner";
import { WhatsAppMessageDialog } from "./whatsapp-message-dialog";

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
        companyRegistrationDocument: string | null;
        companyRegistrationNumber: string | null;
        idDocument: string | null;
        idDocumentType: "ID" | "Passport" | null;
        serviceAgreement: string | null;
        serviceAgreementSignedAt: Date | null;
        capacity: string | null;
        physicalAddress: string | null;
        bankName: string | null;
        bankCode: string | null;
        accountNumber: string | null;
        accountName: string | null;
        bankVerificationDocument: string | null;
        bankVerificationStatus: "Pending" | "Approved" | "Rejected" | null;
        bankVerificationNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        verificationDocumentsSubmittedAt: Date | null;
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
    const [rejectDialog, setRejectDialog] = useState<"operator" | "bank" | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [whatsappDialog, setWhatsappDialog] = useState(false);

    const isPendingReview = !operator.isApproved && operator.verificationDocumentsSubmittedAt;
    const isBankPending = operator.isApproved && operator.bankVerificationStatus === "Pending";
    const isFullyApproved = operator.isApproved && operator.bankVerificationStatus === "Approved";

    const handleApproveOperator = async () => {
        setLoading(true);
        const result = await approveOperator(operator.id);
        setLoading(false);

        if (result.success) {
            toast.success("Operator approved successfully! 🎉");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to approve operator");
        }
    };

    const handleRejectOperator = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setLoading(true);
        const result = await rejectOperator(operator.id, rejectReason);
        setLoading(false);
        setRejectDialog(null);
        setRejectReason("");

        if (result.success) {
            toast.success("Operator application rejected");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to reject operator");
        }
    };

    const handleApproveBankDetails = async () => {
        setLoading(true);
        const result = await approveBankDetails(operator.id);
        setLoading(false);

        if (result.success) {
            toast.success("Bank details approved! 🎉");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to approve bank details");
        }
    };

    const handleRejectBankDetails = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setLoading(true);
        const result = await rejectBankDetails(operator.id, rejectReason);
        setLoading(false);
        setRejectDialog(null);
        setRejectReason("");

        if (result.success) {
            toast.success("Bank details rejected");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to reject bank details");
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
                                        {isPendingReview && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                Pending Review
                                            </Badge>
                                        )}
                                        {isBankPending && (
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                                Bank Pending
                                            </Badge>
                                        )}
                                        {isFullyApproved && (
                                            <Badge variant="default" className="bg-green-600">
                                                Fully Approved
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* WhatsApp Button in Header */}
                            <Button
                                onClick={() => setWhatsappDialog(true)}
                                disabled={!operator.businessWhatsApp}
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send WhatsApp
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Verification Documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Verification Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* CIPC Certificate */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                {operator.companyRegistrationDocument ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                                <div>
                                    <p className="font-medium">CIPC Certificate</p>
                                    {operator.companyRegistrationNumber && (
                                        <p className="text-sm text-muted-foreground">
                                            Reg: {operator.companyRegistrationNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {operator.companyRegistrationDocument && (
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={operator.companyRegistrationDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Document
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* ID Document */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                {operator.idDocument ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {operator.idDocumentType === "Passport" ? "Passport" : "South African ID"}
                                    </p>
                                    {operator.capacity && (
                                        <p className="text-sm text-muted-foreground">Capacity: {operator.capacity}</p>
                                    )}
                                </div>
                            </div>
                            {operator.idDocument && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={operator.idDocument} target="_blank" rel="noopener noreferrer">
                                        View Document
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Service Agreement */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                {operator.serviceAgreement ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                                <div>
                                    <p className="font-medium">Service Agreement (Signed)</p>
                                    {operator.serviceAgreementSignedAt && (
                                        <p className="text-sm text-muted-foreground">
                                            Signed: {format(new Date(operator.serviceAgreementSignedAt), "PPP p")}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {operator.serviceAgreement && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={operator.serviceAgreement} target="_blank" rel="noopener noreferrer">
                                        View PDF
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Banking Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Banking Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Bank Name</p>
                                <p className="font-medium">{operator.bankName || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Bank Code</p>
                                <p className="font-medium">{operator.bankCode || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Account Number</p>
                                <p className="font-medium">{operator.accountNumber || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Account Name</p>
                                <p className="font-medium">{operator.accountName || "Not provided"}</p>
                            </div>
                        </div>

                        {/* Bank Verification Document */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                {operator.bankVerificationDocument ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                                <div>
                                    <p className="font-medium">Bank Verification Document</p>
                                    <p className="text-sm text-muted-foreground">
                                        Bank statement or confirmation letter
                                    </p>
                                </div>
                            </div>
                            {operator.bankVerificationDocument && (
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={operator.bankVerificationDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Document
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Previous Rejection Notes */}
                        {operator.bankVerificationNotes && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-900 mb-1">Previous Rejection Reason:</p>
                                <p className="text-sm text-red-800">{operator.bankVerificationNotes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card >

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
                            {operator.physicalAddress && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Physical Address</p>
                                        <p className="font-medium">{operator.physicalAddress}</p>
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
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Operator Type</p>
                                    <p className="font-medium">
                                        {operator.operatorType === "TourOperator" ? "Tour Operator" : "DMC"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Service Type</p>
                                    <p className="font-medium">
                                        {operator.serviceType === "Inbound"
                                            ? "Inbound (International to SA)"
                                            : operator.serviceType === "Domestic"
                                                ? "Domestic (SA only)"
                                                : operator.serviceType === "Outbound"
                                                    ? "Outbound (SA abroad)"
                                                    : "All Services"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Applied</p>
                                    <p className="font-medium">{format(new Date(operator.createdAt), "PPP")}</p>
                                </div>
                            </div>
                            {operator.verificationDocumentsSubmittedAt && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Submitted for Review</p>
                                        <p className="font-medium">
                                            {format(new Date(operator.verificationDocumentsSubmittedAt), "PPP")}
                                        </p>
                                    </div>
                                </div>
                            )}
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
                {
                    operator.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{operator.description}</p>
                            </CardContent>
                        </Card>
                    )
                }

                {/* Tours (if any) */}
                {
                    operator.tours.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Tours ({operator.tours.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {operator.tours.map((tour) => (
                                        <Link
                                            key={tour.id}
                                            href={`/tours/${tour.id}`}
                                            target="_blank"
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
                            </CardContent>
                        </Card>
                    )
                }

                {/* Action Buttons - Pending Review */}
                {
                    isPendingReview && (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-orange-900 mb-1">Review Application</h3>
                                        <p className="text-sm text-orange-700">
                                            Review all documents and approve or reject this application
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => setWhatsappDialog(true)}
                                            disabled={!operator.businessWhatsApp}
                                            variant="outline"
                                            className="border-green-600 text-green-600 hover:bg-green-50"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                        <Button
                                            onClick={() => setRejectDialog("operator")}
                                            disabled={loading}
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={handleApproveOperator}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve & Go Live
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }

                {/* Action Buttons - Bank Pending */}
                {
                    isBankPending && (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-orange-900 mb-1">Bank Re-verification</h3>
                                        <p className="text-sm text-orange-700">
                                            Operator has updated their bank details. Please review and approve.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => setWhatsappDialog(true)}
                                            disabled={!operator.businessWhatsApp}
                                            variant="outline"
                                            className="border-green-600 text-green-600 hover:bg-green-50"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                        <Button
                                            onClick={() => setRejectDialog("bank")}
                                            disabled={loading}
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject Bank
                                        </Button>
                                        <Button
                                            onClick={handleApproveBankDetails}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve Bank
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }

                {/* Quality Control Card - For Fully Approved Operators */}
                {
                    isFullyApproved && (
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-blue-900 mb-1">Quality Control</h3>
                                        <p className="text-sm text-blue-700">
                                            Send messages about tour quality, images, or general feedback
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setWhatsappDialog(true)}
                                        disabled={!operator.businessWhatsApp}
                                        variant="outline"
                                        className="border-green-600 text-green-600 hover:bg-green-50"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Send Message
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }
            </div >

            {/* Rejection Dialog */}
            < Dialog open={!!rejectDialog
            } onOpenChange={() => setRejectDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {rejectDialog === "operator" ? "Reject Application" : "Reject Bank Details"}
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for the rejection. The operator will receive this feedback.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Explain why the application/bank details are being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={
                                rejectDialog === "operator" ? handleRejectOperator : handleRejectBankDetails
                            }
                            disabled={loading || !rejectReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* WhatsApp Message Dialog */}
            < WhatsAppMessageDialog
                operatorId={operator.id}
                operatorName={operator.businessName}
                whatsappNumber={operator.businessWhatsApp}
                open={whatsappDialog}
                onOpenChange={setWhatsappDialog}
            />
        </>
    );
}