// components/operator/service-agreement-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { OperatorProfile } from "@prisma/client";
import { signServiceAgreement } from "@/actions/operator/service-agreement";
import { toast } from "sonner";

interface ServiceAgreementDialogProps {
    profile: OperatorProfile;
    userName: string;
    userEmail: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const AGREEMENT_TEXT = `
SA TOURS MERCHANT SERVICE AGREEMENT

This Merchant Services Agreement is an agreement between you and SA Tours, a details your obligations and responsibilities in using our platform. By accepting this agreement electronically, you will be deemed to have acknowledged and agreed that you are bound by the terms of the Agreement and it shall be deemed to have been accepted by the Company.

1. ACCEPTANCE OF AGREEMENT
By accepting this Agreement on behalf of your employer or another entity, you represent and warrant that you have full legal authority to bind your employer or such entity to these terms and conditions. If you do not have such authority or if you do not agree to these terms, please do not sign the agreement below.

2. SERVICES
SA Tours provides a platform connecting tour operators with customers seeking tour and activity services in South Africa. The platform facilitates bookings, payments, and customer communications.

3. OPERATOR OBLIGATIONS
As a registered operator, you agree to:
- Provide accurate and up-to-date business information
- Deliver services as described in your tour listings
- Maintain appropriate licenses and insurance
- Respond promptly to booking inquiries and confirmations
- Comply with all applicable laws and regulations

4. PAYMENT TERMS
- SA Tours will collect payments from customers on your behalf
- Commission rates and payout schedules as agreed
- You are responsible for all applicable taxes
- Bank details must be accurate and verified

5. LIABILITY AND INSURANCE
You acknowledge that you are solely responsible for:
- The safety and wellbeing of customers during tours
- Maintaining adequate insurance coverage
- Compliance with safety regulations and standards
- Any damages, injuries, or losses incurred during your services

6. INTELLECTUAL PROPERTY
You grant SA Tours a license to use your business name, logos, photos, and content for marketing purposes on the platform.

7. TERMINATION
Either party may terminate this agreement with 30 days written notice. Upon termination, all pending bookings must be honored.

8. GOVERNING LAW
This agreement is governed by the laws of South Africa.

By signing below, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
`.trim();

export function ServiceAgreementDialog({
    profile,
    userName,
    userEmail,
    open,
    onOpenChange,
    onSuccess,
}: ServiceAgreementDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [hasReadAgreement, setHasReadAgreement] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState(profile.businessName || "");
    const [isSoleProprietor, setIsSoleProprietor] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState(
        profile.companyRegistrationNumber || ""
    );
    const [physicalAddress, setPhysicalAddress] = useState(
        profile.physicalAddress || ""
    );
    const [phone, setPhone] = useState(profile.businessPhone || "");
    const [fullName, setFullName] = useState(userName || "");
    const [capacity, setCapacity] = useState(profile.capacity || "");

    // Validation
    const isFormValid = () => {
        return (
            businessName.trim() &&
            registrationNumber.trim() &&
            physicalAddress.trim() &&
            phone.trim() &&
            fullName.trim() &&
            capacity.trim() &&
            hasReadAgreement &&
            hasScrolledToBottom
        );
    };

    const validateRegistrationNumber = () => {
        if (!registrationNumber.trim()) return "This field is required";

        if (isSoleProprietor) {
            // ID number: 13 digits
            if (!/^\d{13}$/.test(registrationNumber)) {
                return "ID number must be 13 digits";
            }
        } else {
            // Company reg: YYYY/XXXXXX/XX
            if (!/^\d{4}\/\d{6}\/\d{2}$/.test(registrationNumber)) {
                return "Format: YYYY/XXXXXX/XX (e.g., 2023/123456/07)";
            }
        }
        return null;
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom =
            Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;

        if (isAtBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleSubmit = async () => {
        const error = validateRegistrationNumber();
        if (error) {
            toast.error(error);
            return;
        }

        if (!isFormValid()) {
            toast.error("Please complete all fields and read the agreement");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await signServiceAgreement({
                profileId: profile.id,
                businessName: businessName.trim(),
                registrationNumber: registrationNumber.trim(),
                physicalAddress: physicalAddress.trim(),
                phone: phone.trim(),
                email: userEmail,
                fullName: fullName.trim(),
                capacity: capacity.trim(),
                isSoleProprietor,
            });

            if (result.success) {
                toast.success("Service Agreement signed successfully! 🎉");
                onSuccess();
                onOpenChange(false);
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to sign agreement");
            }
        } catch (error) {
            console.error("Error signing agreement:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Sign Service Agreement
                    </DialogTitle>
                    <DialogDescription>
                        Please review and confirm your details below. These will be used in your service
                        agreement.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Warning Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-medium mb-1">Please confirm your details</p>
                                <p>
                                    These details will be used in your service agreement. Any changes made here
                                    will also update your business profile.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Business Details Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="businessName">
                                Business Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="businessName"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Adventure SA Tours"
                            />
                        </div>

                        {/* Sole Proprietor Checkbox */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <Checkbox
                                id="soleProprietor"
                                checked={isSoleProprietor}
                                onCheckedChange={(checked) => {
                                    setIsSoleProprietor(checked as boolean);
                                    setRegistrationNumber(""); // Clear when toggling
                                }}
                            />
                            <Label htmlFor="soleProprietor" className="font-normal cursor-pointer">
                                I am a sole proprietor (no company registration)
                            </Label>
                        </div>

                        {/* Registration Number / ID */}
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber">
                                {isSoleProprietor ? "ID/Passport Number" : "Company Registration Number"}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="registrationNumber"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                placeholder={isSoleProprietor ? "8901015800080" : "2023/123456/07"}
                            />
                            <p className="text-xs text-gray-500">
                                {isSoleProprietor
                                    ? "Your ID or Passport number from your uploaded document"
                                    : "From your CIPC certificate (format: YYYY/XXXXXX/XX)"}
                            </p>
                        </div>

                        {/* Physical Address */}
                        <div className="space-y-2">
                            <Label htmlFor="physicalAddress">
                                Physical Address <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="physicalAddress"
                                value={physicalAddress}
                                onChange={(e) => setPhysicalAddress(e.target.value)}
                                placeholder="123 Main Street, Cape Town, 8001"
                                rows={3}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+27 21 123 4567"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" value={userEmail} disabled className="bg-gray-50" />
                            <p className="text-xs text-gray-500">Cannot be changed here</p>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                Your Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Smith"
                            />
                            <p className="text-xs text-gray-500">
                                This will also update your account name
                            </p>
                        </div>

                        {/* Capacity/Job Title */}
                        <div className="space-y-2">
                            <Label htmlFor="capacity">
                                Capacity/Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Select value={capacity} onValueChange={setCapacity}>
                                <SelectTrigger id="capacity">
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Director">Director</SelectItem>
                                    <SelectItem value="Owner">Owner</SelectItem>
                                    <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Partner">Partner</SelectItem>
                                    <SelectItem value="Authorized Representative">
                                        Authorized Representative
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Agreement Text */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Service Agreement</Label>
                            {!hasScrolledToBottom && (
                                <p className="text-xs text-amber-600 font-medium">
                                    Scroll to bottom to continue
                                </p>
                            )}
                        </div>
                        <ScrollArea
                            className="h-64 w-full border rounded-lg p-4 bg-gray-50"
                            onScroll={handleScroll}
                        >
                            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                {AGREEMENT_TEXT}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Acceptance Checkbox */}
                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <Checkbox
                            id="acceptAgreement"
                            checked={hasReadAgreement}
                            onCheckedChange={(checked) => setHasReadAgreement(checked as boolean)}
                            disabled={!hasScrolledToBottom}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="acceptAgreement"
                            className={`font-normal cursor-pointer text-sm ${!hasScrolledToBottom ? "text-gray-400" : "text-gray-900"
                                }`}
                        >
                            I have read and accept the Service Agreement. I confirm that all details provided
                            above are accurate and I have the authority to bind my business to these terms.
                        </Label>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Signing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accept & Sign Agreement
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}