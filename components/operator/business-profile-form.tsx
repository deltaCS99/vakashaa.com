// components/operator/business-profile-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { updateOperatorBusinessProfile } from "@/actions/operator/settings";
import { toast } from "sonner";

interface BusinessProfileFormProps {
    operatorProfile: {
        id: string;
        businessName: string;
        businessPhone: string | null;
        businessWhatsApp: string | null;
        description: string | null;
    };
}

export function BusinessProfileForm({ operatorProfile }: BusinessProfileFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [businessName, setBusinessName] = useState(operatorProfile.businessName);
    const [businessPhone, setBusinessPhone] = useState(operatorProfile.businessPhone || "");
    const [businessWhatsApp, setBusinessWhatsApp] = useState(operatorProfile.businessWhatsApp || "");
    const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(
        operatorProfile.businessPhone === operatorProfile.businessWhatsApp
    );
    const [description, setDescription] = useState(operatorProfile.description || "");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!businessName.trim()) {
            toast.error("Business name is required");
            return;
        }

        if (!businessPhone.trim()) {
            toast.error("Business phone is required");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateOperatorBusinessProfile({
                businessName: businessName.trim(),
                businessPhone: businessPhone.trim(),
                businessWhatsApp: whatsappSameAsPhone
                    ? businessPhone.trim()
                    : businessWhatsApp.trim() || businessPhone.trim(),
                description: description.trim() || null,
            });

            if (result.success) {
                toast.success("Business profile updated successfully!");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating business profile:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
                <Label htmlFor="businessName">
                    Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="businessName"
                    type="text"
                    placeholder="e.g., Safari Adventures SA"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={isSaving}
                    required
                />
                <p className="text-xs text-gray-500">
                    This name will appear on your tours and quotes
                </p>
            </div>

            {/* Business Phone */}
            <div className="space-y-2">
                <Label htmlFor="businessPhone">
                    Business Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="businessPhone"
                    type="tel"
                    placeholder="+27 12 345 6789"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    disabled={isSaving}
                    required
                />
                <p className="text-xs text-gray-500">
                    Primary contact number for your business
                </p>
            </div>

            {/* Business WhatsApp */}
            <div className="space-y-2">
                <Label htmlFor="businessWhatsApp">
                    Business WhatsApp <span className="text-red-500">*</span>
                </Label>

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
                        disabled={isSaving}
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
                        disabled={isSaving}
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

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                    id="description"
                    placeholder="Tell customers about your business, your experience, and what makes your tours special..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    rows={5}
                    className="resize-none"
                />
                <p className="text-xs text-gray-500">
                    Optional: This description will appear on your operator profile
                </p>
            </div>

            {/* Save Button */}
            <Button
                type="submit"
                disabled={isSaving || !businessName.trim() || !businessPhone.trim()}
                className="w-full"
                size="lg"
            >
                {isSaving ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Save Business Profile"
                )}
            </Button>
        </form>
    );
}