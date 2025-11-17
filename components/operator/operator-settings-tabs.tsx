// components/operator/operator-settings-tabs.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Building2, FileCheck, CreditCard, Rocket, Loader2, AlertCircle } from "lucide-react";
import { OperatorProfileSettings } from "./operator-profile-settings";
import { OperatorVerificationSettings } from "./operator-verification-settings";
import { OperatorBankingSettings } from "./operator-banking-settings";
import { OperatorProfile } from "@prisma/client";
import { getOperatorStatus, canEditVerificationDocs } from "@/lib/operator";
import { submitForVerification, submitBankReverification } from "@/actions/operator/verification";
import { toast } from "sonner";

interface OperatorSettingsTabsProps {
    profile: OperatorProfile;
    userName: string;
    userEmail: string;
    defaultTab?: string;
}

export function OperatorSettingsTabs({
    profile,
    userName,
    userEmail,
    defaultTab
}: OperatorSettingsTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(defaultTab || "profile");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const status = getOperatorStatus(profile);
    const canEditDocs = canEditVerificationDocs(profile);

    // Update active tab when URL changes
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && ["profile", "verification", "banking"].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Update URL when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);

        // Update URL with new tab
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`/operator/settings?${params.toString()}`, { scroll: false });
    };

    // Refresh callback for child components
    const handleRefresh = () => {
        router.refresh();
    };

    // Check completion
    const hasAllDocs =
        profile.companyRegistrationDocument &&
        profile.idDocument &&
        profile.serviceAgreement;

    const hasAllBank =
        profile.bankCode &&
        profile.accountNumber &&
        profile.accountName &&
        profile.bankVerificationDocument;

    const canSubmitForVerification = hasAllDocs && hasAllBank && canEditDocs;

    // Check if bank changed (for re-verification after approval)
    const bankChanged =
        profile.isApproved &&
        profile.bankVerificationStatus !== "Pending" &&
        hasAllBank;

    const handleSubmitVerification = () => {
        if (!canSubmitForVerification) {
            toast.error("Please complete all verification steps");
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);

        try {
            const result = await submitForVerification(profile.id);

            if (result.success) {
                toast.success("Submitted for verification! 🎉");
                setShowConfirmDialog(false);
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to submit");
            }
        } catch (error) {
            console.error("Error submitting:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBankReverification = async () => {
        setIsSubmitting(true);

        try {
            const result = await submitBankReverification(profile.id);

            if (result.success) {
                toast.success("Bank details submitted for re-verification!");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to submit");
            }
        } catch (error) {
            console.error("Error submitting bank re-verification:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Business Profile
                    </TabsTrigger>
                    <TabsTrigger value="verification" className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Verification
                    </TabsTrigger>
                    <TabsTrigger value="banking" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Banking
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <OperatorProfileSettings profile={profile} />
                </TabsContent>

                <TabsContent value="verification" className="mt-6">
                    <OperatorVerificationSettings
                        profile={profile}
                        userName={userName}
                        userEmail={userEmail}
                        onDocsChange={handleRefresh}
                    />
                </TabsContent>

                <TabsContent value="banking" className="mt-6">
                    <OperatorBankingSettings
                        profile={profile}
                        onDocsChange={handleRefresh}
                    />
                </TabsContent>
            </Tabs>

            {/* Initial Verification Submit Button */}
            {canEditDocs && (
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Rocket className="w-8 h-8 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-2">Ready to go live?</h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    {canSubmitForVerification
                                        ? "All verification steps completed! Submit for admin review to start receiving bookings."
                                        : "Complete all fields in the Verification and Banking tabs to submit."}
                                </p>
                                {!hasAllDocs && (
                                    <p className="text-sm text-blue-700 mb-2">
                                        ❌ Missing verification documents
                                    </p>
                                )}
                                {!hasAllBank && (
                                    <p className="text-sm text-blue-700 mb-4">
                                        ❌ Missing bank details or document
                                    </p>
                                )}
                                <Button
                                    onClick={handleSubmitVerification}
                                    disabled={!canSubmitForVerification || isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700"
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="w-4 h-4 mr-2" />
                                            Submit for Verification
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bank Re-verification Button (After Approval) */}
            {!canEditDocs && bankChanged && (
                <Card className="mt-6 bg-orange-50 border-orange-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900 mb-2">Bank details updated</h3>
                                <p className="text-sm text-orange-700 mb-4">
                                    You&apos;ve updated your bank details. Submit for re-verification to start receiving payouts to your new account. Your tours will remain live during the process.
                                </p>
                                <Button
                                    onClick={handleBankReverification}
                                    disabled={isSubmitting}
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Bank Re-verification"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit for Verification?</DialogTitle>
                        <DialogDescription>
                            Please confirm you want to submit your business for verification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium mb-2">What happens next:</p>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Admin reviews your documents and bank details</li>
                                <li>• Verification typically takes 1-2 business days</li>
                                <li>• You&apos;ll receive an email when approved</li>
                                <li>• Once approved, your tours go live immediately</li>
                            </ul>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-900">
                                <strong>Note:</strong> Verification documents cannot be changed after submission. Make sure all details are correct.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Confirm & Submit"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}