// components/operator/operator-status-banner.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Rocket,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { OperatorProfile } from "@prisma/client";
import { getOperatorStatus } from "@/lib/operator";
import Link from "next/link";

interface OperatorStatusBannerProps {
    profile: OperatorProfile;
}

export function OperatorStatusBanner({ profile }: OperatorStatusBannerProps) {
    const status = getOperatorStatus(profile);

    // Calculate completion percentage
    const getCompletionPercentage = () => {
        let completed = 0;
        const total = 5;

        if (profile.companyRegistrationDocument) completed++;
        if (profile.idDocument) completed++;
        if (profile.serviceAgreement) completed++;
        if (profile.bankCode && profile.accountNumber && profile.accountName) completed++;
        if (profile.bankVerificationDocument) completed++;

        return Math.round((completed / total) * 100);
    };

    const percentage = getCompletionPercentage();

    // Draft Mode
    if (status === "draft") {
        return (
            <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Rocket className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-blue-900">Draft Mode</h3>
                                <Badge variant="outline" className="bg-white">
                                    Not Live
                                </Badge>
                            </div>
                            <p className="text-sm text-blue-800 mb-4">
                                Create and manage your tours. When ready, submit for verification to go live.
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-blue-900">
                                        Verification Progress
                                    </span>
                                    <span className="text-xs font-medium text-blue-900">{percentage}%</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>

                            {/* Checklist */}
                            <div className="mb-4 space-y-2">
                                <p className="text-xs font-medium text-blue-900 mb-2">
                                    Required for verification:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        {profile.companyRegistrationDocument ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span
                                            className={
                                                profile.companyRegistrationDocument ? "text-green-900" : "text-gray-600"
                                            }
                                        >
                                            CIPC Certificate
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {profile.idDocument ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span className={profile.idDocument ? "text-green-900" : "text-gray-600"}>
                                            ID/Passport
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {profile.serviceAgreement ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span
                                            className={profile.serviceAgreement ? "text-green-900" : "text-gray-600"}
                                        >
                                            Service Agreement
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {profile.bankCode && profile.accountNumber && profile.accountName ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span
                                            className={
                                                profile.bankCode && profile.accountNumber && profile.accountName
                                                    ? "text-green-900"
                                                    : "text-gray-600"
                                            }
                                        >
                                            Bank Details
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:col-span-2">
                                        {profile.bankVerificationDocument ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span
                                            className={
                                                profile.bankVerificationDocument ? "text-green-900" : "text-gray-600"
                                            }
                                        >
                                            Bank Verification Document
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                <Link href="/operator/settings?tab=verification">
                                    Complete Verification Steps
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Pending Review
    if (status === "pending_review") {
        return (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-yellow-900">Verification in Progress</h3>
                                <Badge variant="outline" className="bg-white border-yellow-300">
                                    Under Review
                                </Badge>
                            </div>
                            <p className="text-sm text-yellow-800 mb-2">
                                Your documents are being reviewed by our admin team.
                            </p>
                            <div className="text-xs text-yellow-700 space-y-1">
                                <p>
                                    • Submitted on{" "}
                                    {profile.verificationDocumentsSubmittedAt &&
                                        new Date(profile.verificationDocumentsSubmittedAt).toLocaleDateString(
                                            "en-ZA"
                                        )}
                                </p>
                                <p>• Typically takes 1-2 business days</p>
                                <p>• You&apos;ll receive an email when approved</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Fully Live (with potential bank re-verification)
    if (status === "live") {
        const bankReverification = profile.bankVerificationStatus === "Pending" && profile.isApproved;

        return (
            <Card
                className={`mb-6 ${bankReverification
                        ? "border-orange-200 bg-orange-50"
                        : "border-green-200 bg-green-50"
                    }`}
            >
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={`p-2 rounded-lg ${bankReverification ? "bg-orange-100" : "bg-green-100"
                                }`}
                        >
                            {bankReverification ? (
                                <AlertCircle className="w-6 h-6 text-orange-600" />
                            ) : (
                                <Sparkles className="w-6 h-6 text-green-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3
                                    className={`font-semibold ${bankReverification ? "text-orange-900" : "text-green-900"
                                        }`}
                                >
                                    {bankReverification ? "Bank Re-verification Pending" : "You're Live!"}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className={`bg-white ${bankReverification ? "border-orange-300" : "border-green-300"
                                        }`}
                                >
                                    Active
                                </Badge>
                            </div>
                            <p
                                className={`text-sm ${bankReverification ? "text-orange-800" : "text-green-800"
                                    }`}
                            >
                                {bankReverification
                                    ? "Your tours are live and visible to customers. Your updated bank details are being verified for payouts."
                                    : "Your tours are now visible to customers. Start receiving bookings and growing your business!"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}