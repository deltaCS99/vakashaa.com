// components/admin/operator-details.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    PackageOpen,
    MessageSquareQuote,
    Ban,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
    approveOperator,
    rejectOperator,
    approveBankDetails,
    rejectBankDetails,
    getQuoteMessages,
} from "@/actions/admin/operators";
import { toast } from "sonner";
import { WhatsAppMessageDialog } from "./whatsapp-message-dialog";
import { QuoteStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

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
            category: string | null;
            priceFrom: number | null;
            currency: string;
            isActive: boolean;
            images: string[];
            createdAt: Date;
            _count: {
                quoteRequests: number;
            };
        }[];
        quoteRequests: {
            id: string;
            reference: string;
            status: QuoteStatus;
            quotedPrice: number | null;
            adults: number;
            children: number;
            preferredDate: string;
            createdAt: Date;
            tour: {
                id: string;
                title: string;
            };
            user: {
                id: string;
                name: string | null;
                email: string | null;
            };
        }[];
    };
}

interface QuoteMessage {
    id: string;
    senderId: string;
    senderType: string;
    message: string;
    createdAt: Date;
    readAt: Date | null;
}

export function OperatorDetails({ operator }: OperatorDetailsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [rejectDialog, setRejectDialog] = useState<"operator" | "bank" | "deactivate" | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [whatsappDialog, setWhatsappDialog] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedQuote, setSelectedQuote] = useState<typeof operator.quoteRequests[0] | null>(null);
    const [quoteMessages, setQuoteMessages] = useState<QuoteMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sheetTab, setSheetTab] = useState("info");

    const isPendingReview = !operator.isApproved && operator.verificationDocumentsSubmittedAt;
    const isBankPending = operator.isApproved && operator.bankVerificationStatus === "Pending";
    const isFullyApproved = operator.isApproved && operator.bankVerificationStatus === "Approved";

    // Calculate stats
    const totalRevenue = operator.quoteRequests
        .filter(q => q.status === "Paid" && q.quotedPrice)
        .reduce((sum, q) => sum + (q.quotedPrice || 0), 0);

    const quotesByStatus = {
        pending: operator.quoteRequests.filter(q => q.status === "Pending").length,
        quoted: operator.quoteRequests.filter(q => q.status === "Quoted").length,
        accepted: operator.quoteRequests.filter(q => q.status === "Accepted").length,
        paid: operator.quoteRequests.filter(q => q.status === "Paid").length,
    };

    // Fetch messages when quote is selected
    useEffect(() => {
        if (selectedQuote) {
            setLoadingMessages(true);
            setSheetTab("info");
            getQuoteMessages(selectedQuote.id).then((result) => {
                if (result.success && "data" in result) {
                    setQuoteMessages(result.data.messages);
                }
                setLoadingMessages(false);
            });
        }
    }, [selectedQuote]);

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
            const message = rejectDialog === "deactivate"
                ? "Operator deactivated"
                : "Operator application rejected";
            toast.success(message);
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

    const getStatusColor = (status: QuoteStatus) => {
        switch (status) {
            case "Paid":
            case "Completed":
                return "bg-green-100 text-green-800";
            case "Accepted":
                return "bg-blue-100 text-blue-800";
            case "Quoted":
                return "bg-purple-100 text-purple-800";
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "Rejected":
            case "Cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
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
                        </div>
                    </CardHeader>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <PackageOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <p className="text-2xl font-bold">{operator.tours.length}</p>
                                <p className="text-sm text-muted-foreground">Tours</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <MessageSquareQuote className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                <p className="text-2xl font-bold">{operator.quoteRequests.length}</p>
                                <p className="text-sm text-muted-foreground">Total Quotes</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <p className="text-2xl font-bold">{quotesByStatus.paid}</p>
                                <p className="text-sm text-muted-foreground">Bookings</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tours">
                            Tours ({operator.tours.length})
                        </TabsTrigger>
                        <TabsTrigger value="quotes">
                            Quotes ({operator.quoteRequests.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
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
                                    <p className="text-muted-foreground whitespace-pre-wrap">{operator.description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* TOURS TAB - Simple Links */}
                    <TabsContent value="tours" className="space-y-4">
                        {operator.tours.length > 0 ? (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        {operator.tours.map((tour) => (
                                            <div
                                                key={tour.id}
                                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={`/tours/${tour.id}`}
                                                            target="_blank"
                                                            className="font-medium hover:underline flex items-center gap-2"
                                                        >
                                                            {tour.title}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                        <Badge
                                                            variant={tour.isActive ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {tour.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                        <span>{tour.category || "Uncategorized"}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {tour.priceFrom
                                                                ? `${formatPrice(tour.priceFrom)}`
                                                                : "Price on request"
                                                            }
                                                        </span>
                                                        <span>•</span>
                                                        <span>{tour._count.quoteRequests} quotes</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(tour.createdAt), "PP")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <PackageOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No tours created yet</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* QUOTES TAB */}
                    <TabsContent value="quotes" className="space-y-4">
                        {operator.quoteRequests.length > 0 ? (
                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Reference
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Tour
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Customer
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Status
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Amount
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {operator.quoteRequests.map((quote) => (
                                                    <tr key={quote.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium">
                                                            {quote.reference}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {quote.tour.title}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {quote.user.name || quote.user.email}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant="secondary"
                                                                className={getStatusColor(quote.status)}
                                                            >
                                                                {quote.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium">
                                                            {quote.quotedPrice
                                                                ? `${formatPrice(quote.quotedPrice)}`
                                                                : "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                                            {format(new Date(quote.preferredDate), "PPP")}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedQuote(quote)}
                                                            >
                                                                View Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <MessageSquareQuote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No quote requests yet</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs >

                {/* Simple Action Section */}
                < div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50" >
                    <div className="text-sm text-gray-600">
                        {isPendingReview && "Review documents and approve or reject this operator"}
                        {isBankPending && "Review updated bank details and approve or reject"}
                        {isFullyApproved && "Contact operator or manage their account"}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setWhatsappDialog(true)}
                            disabled={!operator.businessWhatsApp}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            WhatsApp
                        </Button>

                        {isPendingReview && (
                            <>
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
                                    Approve
                                </Button>
                            </>
                        )}

                        {isBankPending && (
                            <>
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
                            </>
                        )}

                        {isFullyApproved && (
                            <Button
                                onClick={() => setRejectDialog("deactivate")}
                                disabled={loading}
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                Deactivate
                            </Button>
                        )}
                    </div>
                </div >
            </div >

            {/* Rejection/Deactivation Dialog */}
            < Dialog open={!!rejectDialog
            } onOpenChange={() => setRejectDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {rejectDialog === "operator" && "Reject Application"}
                            {rejectDialog === "bank" && "Reject Bank Details"}
                            {rejectDialog === "deactivate" && "Deactivate Operator"}
                        </DialogTitle>
                        <DialogDescription>
                            {rejectDialog === "deactivate"
                                ? "This will deactivate the operator and all their tours. They will need to be re-approved."
                                : "Please provide a reason for the rejection. The operator will receive this feedback."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">
                                {rejectDialog === "deactivate" ? "Deactivation Reason *" : "Rejection Reason *"}
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder={
                                    rejectDialog === "deactivate"
                                        ? "Explain why the operator is being deactivated (quality issues, policy violations, etc.)..."
                                        : "Explain why the application/bank details are being rejected..."
                                }
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
                                rejectDialog === "bank" ? handleRejectBankDetails : handleRejectOperator
                            }
                            disabled={loading || !rejectReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {rejectDialog === "deactivate" ? "Deactivate Operator" : "Confirm Rejection"}
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

            {/* Quote Details Sheet with Tabs */}
            < Sheet open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
                <SheetContent className="w-full sm:max-w-lg">
                    {selectedQuote && (
                        <>
                            <SheetHeader>
                                <SheetTitle>Quote {selectedQuote.reference}</SheetTitle>
                                <SheetDescription>
                                    View quote details and messages
                                </SheetDescription>
                            </SheetHeader>

                            <Tabs value={sheetTab} onValueChange={setSheetTab} className="mt-6">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info">Info</TabsTrigger>
                                    <TabsTrigger value="messages">
                                        Messages ({quoteMessages.length})
                                    </TabsTrigger>
                                </TabsList>

                                {/* Info Tab */}
                                <TabsContent value="info" className="space-y-6 mt-6">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Status</Label>
                                        <Badge
                                            variant="secondary"
                                            className={`${getStatusColor(selectedQuote.status)} mt-1`}
                                        >
                                            {selectedQuote.status}
                                        </Badge>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tour</Label>
                                        <p className="font-medium mt-1">{selectedQuote.tour.title}</p>
                                        <Link
                                            href={`/tours/${selectedQuote.tour.id}`}
                                            target="_blank"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                        >
                                            View tour page
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-muted-foreground">Customer</Label>
                                        <p className="font-medium mt-1">
                                            {selectedQuote.user.name || selectedQuote.user.email}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Preferred Date</Label>
                                            <p className="font-medium mt-1">
                                                {format(new Date(selectedQuote.preferredDate), "PPP")}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Requested</Label>
                                            <p className="font-medium mt-1">
                                                {format(new Date(selectedQuote.createdAt), "PPP")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Adults</Label>
                                            <p className="font-medium mt-1">{selectedQuote.adults}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Children</Label>
                                            <p className="font-medium mt-1">{selectedQuote.children}</p>
                                        </div>
                                    </div>

                                    {selectedQuote.quotedPrice && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Quoted Amount</Label>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatPrice(selectedQuote.quotedPrice)}
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Messages Tab */}
                                <TabsContent value="messages" className="mt-6">
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : quoteMessages.length > 0 ? (
                                        <ScrollArea className="h-[500px] pr-4">
                                            <div className="space-y-4">
                                                {quoteMessages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`p-3 rounded-lg ${message.senderType === "customer"
                                                            ? "bg-blue-50 border-l-4 border-blue-500"
                                                            : "bg-green-50 border-l-4 border-green-500"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                {message.senderType === "customer" ? "Customer" : "Operator"}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {format(new Date(message.createdAt), "PPp")}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                            {message.message}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No messages yet</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </SheetContent>
            </Sheet >
        </>
    );
}