// app/operator/apply/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator";
import { OperatorApplicationForm } from "@/components/operator/operator-application-form";
import { Card } from "@/components/ui/card";
import { CheckCircle2, FileText, Shield, Users } from "lucide-react";

export const metadata: Metadata = {
    title: "Apply as Tour Operator | SA Tours",
    description: "Apply to become a tour operator on SA Tours",
};

export default async function OperatorApplyPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/login?callbackUrl=/operator/apply");
    }

    // Check if user already has an operator profile
    const existingProfile = await getOperatorProfile();

    if (existingProfile) {
        if (existingProfile.isApproved) {
            redirect("/operator/dashboard");
        } else {
            // Already applied, show pending status
            return (
                <div className="min-h-screen bg-gray-50/50 py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-2xl mx-auto">
                            <Card className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
                                <p className="text-gray-600 mb-6">
                                    Thank you for applying! Your operator application is currently being reviewed by
                                    our team.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                    <p className="text-sm font-medium text-blue-900 mb-2">What happens next?</p>
                                    <ul className="text-sm text-blue-800 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>We&apos;ll review your application and documentation</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>This typically takes 1-2 business days</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>You&apos;ll receive an email notification once approved</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-6 pt-6 border-t">
                                    <p className="text-sm text-gray-600">
                                        <strong>Business:</strong> {existingProfile.businessName}
                                    </p>
                                    {existingProfile.businessPhone && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>Phone:</strong> {existingProfile.businessPhone}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-3">Become a Tour Operator</h1>
                        <p className="text-gray-600 text-lg">
                            Join SA Tours and start offering amazing experiences to travelers
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Reach More Customers</h3>
                            <p className="text-sm text-gray-600">
                                Connect with travelers looking for authentic South African experiences
                            </p>
                        </Card>

                        <Card className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Secure Platform</h3>
                            <p className="text-sm text-gray-600">
                                Safe payment processing and booking management system
                            </p>
                        </Card>

                        <Card className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Easy Management</h3>
                            <p className="text-sm text-gray-600">
                                Simple tools to manage tours, quotes, and bookings in one place
                            </p>
                        </Card>
                    </div>

                    {/* Application Form */}
                    <Card className="p-8">
                        <OperatorApplicationForm userId={user.id!} />
                    </Card>

                    {/* Terms Notice */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>
                            By submitting this application, you agree to our{" "}
                            <a href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}