// components/operator/operator-application-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Info } from "lucide-react";
import { submitOperatorApplication } from "@/actions/operator/application";
import { toast } from "sonner";

interface OperatorApplicationFormProps {
    userId: string;
}

export function OperatorApplicationForm({ userId }: OperatorApplicationFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessWhatsApp, setBusinessWhatsApp] = useState("");
    const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
    const [description, setDescription] = useState("");
    const [operatorType, setOperatorType] = useState<"TourOperator" | "DMC">("TourOperator");
    const [serviceType, setServiceType] = useState<"Inbound" | "Domestic" | "Outbound" | "All">(
        "All"
    );
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!businessName.trim()) {
            toast.error("Business name is required");
            return;
        }

        if (!acceptedTerms) {
            toast.error("Please accept the terms and conditions");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitOperatorApplication({
                userId,
                businessName: businessName.trim(),
                businessPhone: businessPhone.trim() || undefined,
                businessWhatsApp: whatsappSameAsPhone
                    ? businessPhone.trim() || undefined
                    : businessWhatsApp.trim() || undefined,
                description: description.trim() || undefined,
                operatorType,
                serviceType,
            });

            if (result.success) {
                toast.success("Application submitted successfully!");
                router.push("/operator/apply"); // Refresh to show pending state
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to submit application");
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>

                <div className="space-y-4">
                    {/* Business Name */}
                    <div className="space-y-2">
                        <Label htmlFor="businessName">
                            Business Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="businessName"
                            placeholder="e.g., African Adventures Tours"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Operator Type */}
                    <div className="space-y-2">
                        <Label htmlFor="operatorType">
                            Operator Type <span className="text-red-500">*</span>
                        </Label>
                        <Select value={operatorType} onValueChange={(value: any) => setOperatorType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TourOperator">Tour Operator</SelectItem>
                                <SelectItem value="DMC">
                                    DMC (Destination Management Company)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Tour Operators offer specific tours. DMCs provide comprehensive destination services.
                        </p>
                    </div>

                    {/* Service Type */}
                    <div className="space-y-2">
                        <Label htmlFor="serviceType">
                            Service Type <span className="text-red-500">*</span>
                        </Label>
                        <Select value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Services</SelectItem>
                                <SelectItem value="Inbound">Inbound (International tourists to SA)</SelectItem>
                                <SelectItem value="Domestic">Domestic (SA residents within SA)</SelectItem>
                                <SelectItem value="Outbound">Outbound (SA residents abroad)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Business Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell us about your business, experience, and what makes you unique..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                        <p className="text-xs text-gray-500">
                            This will be displayed on your operator profile
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                <div className="space-y-4">
                    {/* Business Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                            id="businessPhone"
                            type="tel"
                            placeholder="+27 12 345 6789"
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                        />
                    </div>

                    {/* Business WhatsApp */}
                    <div className="space-y-2">
                        <Label htmlFor="businessWhatsApp">Business WhatsApp</Label>

                        <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                                id="whatsappSame"
                                checked={whatsappSameAsPhone}
                                onCheckedChange={(checked) => {
                                    setWhatsappSameAsPhone(checked as boolean);
                                    if (checked) {
                                        setBusinessWhatsApp("");
                                    }
                                }}
                            />
                            <label
                                htmlFor="whatsappSame"
                                className="text-sm text-gray-600 cursor-pointer"
                            >
                                Same as business phone
                            </label>
                        </div>

                        {!whatsappSameAsPhone && (
                            <Input
                                id="businessWhatsApp"
                                type="tel"
                                placeholder="+27 82 345 6789"
                                value={businessWhatsApp}
                                onChange={(e) => setBusinessWhatsApp(e.target.value)}
                            />
                        )}

                        {whatsappSameAsPhone && businessPhone && (
                            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                                WhatsApp: {businessPhone}
                            </div>
                        )}

                        <p className="text-xs text-gray-500">
                            Customers can reach you via WhatsApp for quick inquiries
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">What happens after you apply?</p>
                    <ul className="space-y-1 text-blue-800">
                        <li>• Our team will review your application within 1-2 business days</li>
                        <li>• You&apos;ll receive an email notification once approved</li>
                        <li>• Once approved, you can start creating tours and responding to quotes</li>
                    </ul>
                </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <div className="flex-1">
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        I accept the terms and conditions <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        I understand that SA Tours will review my application and that I agree to comply with
                        the platform&apos;s operator guidelines and terms of service.
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || !acceptedTerms} size="lg" className="w-full">
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    "Submit Application"
                )}
            </Button>
        </form>
    );
}