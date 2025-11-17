// components/operator/bank-details-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { updateOperatorBankDetails } from "@/actions/operator/settings";
import { BankDocumentUpload } from "@/components/operator/bank-document-upload";
import { toast } from "sonner";

// South African banks supported by Paystack
const SA_BANKS = [
    { code: "632005", name: "ABSA Bank" },
    { code: "410506", name: "African Bank" },
    { code: "430000", name: "Bidvest Bank" },
    { code: "462005", name: "Capitec Bank" },
    { code: "470010", name: "Discovery Bank" },
    { code: "011", name: "First National Bank (FNB)" },
    { code: "058", name: "Nedbank" },
    { code: "051001", name: "Standard Bank" },
    { code: "679000", name: "Tyme Bank" },
];

type VerificationStatus = "Pending" | "Approved" | "Rejected" | null;

interface BankDetailsFormProps {
    operatorProfile: {
        id: string;
        bankName: string | null;
        bankCode: string | null;
        accountNumber: string | null;
        accountName: string | null;
        paystackSubaccountCode: string | null;
        bankVerificationStatus: VerificationStatus;
        bankVerificationDocument: string | null;
        bankVerificationNotes: string | null;
    };
    platformCommissionRate: number;
}

export function BankDetailsForm({ operatorProfile, platformCommissionRate }: BankDetailsFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [bankCode, setBankCode] = useState(operatorProfile.bankCode || "");
    const [accountNumber, setAccountNumber] = useState(operatorProfile.accountNumber || "");
    const [accountName, setAccountName] = useState(operatorProfile.accountName || "");
    const [verificationDocument, setVerificationDocument] = useState(
        operatorProfile.bankVerificationDocument || null
    );

    const verificationStatus = operatorProfile.bankVerificationStatus;
    const selectedBank = SA_BANKS.find((bank) => bank.code === bankCode);

    // Form is only locked when status is Pending (awaiting admin review)
    const isEditable = verificationStatus !== "Pending";
    const hasExistingDetails = !!(
        operatorProfile.bankCode &&
        operatorProfile.accountNumber &&
        operatorProfile.accountName
    );

    // Handle save
    const handleSave = async () => {
        if (!bankCode || !accountNumber || !accountName) {
            toast.error("Please complete all bank details");
            return;
        }

        if (!verificationDocument) {
            toast.error("Please upload a verification document");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateOperatorBankDetails({
                bankName: selectedBank?.name || "",
                bankCode,
                accountNumber,
                accountName,
                verificationDocument,
            });

            if (result.success) {
                toast.success("Bank details submitted for verification!");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to save bank details");
            }
        } catch (error) {
            console.error("Error saving bank details:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Verification Status Banner */}
            {verificationStatus === "Pending" && (
                <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Under Review</p>
                                <p className="text-sm mt-1">
                                    Your bank details are being verified by our team. This usually takes 1-2 business days.
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Pending
                            </Badge>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {verificationStatus === "Approved" && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Verified</p>
                                <p className="text-sm mt-1">
                                    Your bank details have been verified and your payment account is active.
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                            </Badge>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {verificationStatus === "Rejected" && operatorProfile.bankVerificationNotes && (
                <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold">Verification Rejected</p>
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                    Rejected
                                </Badge>
                            </div>
                            <p className="text-sm font-medium mb-1">Reason:</p>
                            <p className="text-sm">{operatorProfile.bankVerificationNotes}</p>
                            <p className="text-sm mt-2">Please update your details and resubmit.</p>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Subaccount Status */}
            {operatorProfile.paystackSubaccountCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-green-900">Payment Account Active</p>
                            <p className="text-green-700 mt-1">
                                Your Paystack subaccount is set up and ready to receive payments.
                                {verificationStatus === "Approved" && " You can update your details below if needed (will require re-verification)."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Selection */}
            <div className="space-y-2">
                <Label htmlFor="bank">
                    Bank <span className="text-red-500">*</span>
                </Label>
                <Select value={bankCode} onValueChange={setBankCode} disabled={!isEditable || isSaving}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                        {SA_BANKS.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
                <Label htmlFor="accountNumber">
                    Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="accountNumber"
                    type="text"
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    maxLength={15}
                    disabled={!isEditable || isSaving}
                />
                <p className="text-xs text-gray-500">Enter your account number without spaces</p>
            </div>

            {/* Account Name */}
            <div className="space-y-2">
                <Label htmlFor="accountName">
                    Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="accountName"
                    type="text"
                    placeholder="John Doe"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={!isEditable || isSaving}
                />
                <p className="text-xs text-gray-500">Name as it appears on your bank account</p>
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
                <Label>
                    Verification Document <span className="text-red-500">*</span>
                </Label>
                <BankDocumentUpload
                    documentUrl={verificationDocument}
                    onDocumentChange={setVerificationDocument}
                    operatorProfileId={operatorProfile.id}
                    disabled={!isEditable || isSaving}
                />
            </div>

            {/* Important Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        <p className="font-semibold mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Ensure the account details are correct - we cannot reverse incorrect payments</li>
                            <li>This account will receive payments minus platform commission ({platformCommissionRate}%)</li>
                            <li>Paystack transaction fees are deducted from your portion</li>
                            <li>Payments are processed within 2-3 business days after customer payment</li>
                            <li>Your bank details will be verified by our admin team before activation</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={
                    isSaving ||
                    !isEditable ||
                    !bankCode ||
                    !accountNumber ||
                    !accountName ||
                    !verificationDocument
                }
                className="w-full"
                size="lg"
            >
                {isSaving ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                    </>
                ) : verificationStatus === "Rejected" || hasExistingDetails ? (
                    "Update & Resubmit for Verification"
                ) : (
                    "Submit for Verification"
                )}
            </Button>

            {!isEditable && verificationStatus === "Pending" && (
                <p className="text-xs text-center text-gray-500">
                    You cannot edit bank details while verification is pending
                </p>
            )}
        </div>
    );
}