// components/operator/operator-profile-settings.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { OperatorProfile } from "@prisma/client";
import { updateOperatorProfile } from "@/actions/operator/settings";

interface OperatorProfileSettingsProps {
    profile: OperatorProfile;
}

export function OperatorProfileSettings({ profile }: OperatorProfileSettingsProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [businessName, setBusinessName] = useState(profile.businessName);
    const [businessPhone, setBusinessPhone] = useState(profile.businessPhone);
    const [businessWhatsApp, setBusinessWhatsApp] = useState(profile.businessWhatsApp);
    const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(
        profile.businessPhone === profile.businessWhatsApp
    );
    const [description, setDescription] = useState(profile.description || "");
    const [operatorType, setOperatorType] = useState(profile.operatorType);
    const [serviceType, setServiceType] = useState(profile.serviceType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!businessName.trim() || !businessPhone.trim()) {
            toast.error("Business name and phone are required");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await updateOperatorProfile({
                profileId: profile.id,
                businessName: businessName.trim(),
                businessPhone: businessPhone.trim(),
                businessWhatsApp: whatsappSameAsPhone
                    ? businessPhone.trim()
                    : businessWhatsApp.trim(),
                description: description.trim() || undefined,
                operatorType,
                serviceType,
            });

            if (result.success) {
                toast.success("Profile updated successfully!");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Business Name */}
                    <div className="space-y-2">
                        <Label htmlFor="businessName">
                            Business Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="businessName"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Operator Type */}
                    <div className="space-y-2">
                        <Label htmlFor="operatorType">Operator Type</Label>
                        <Select
                            value={operatorType}
                            onValueChange={(value: any) => setOperatorType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TourOperator">Tour Operator</SelectItem>
                                <SelectItem value="DMC">DMC (Destination Management Company)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Service Type */}
                    <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <Select
                            value={serviceType}
                            onValueChange={(value: any) => setServiceType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Services</SelectItem>
                                <SelectItem value="Inbound">Inbound (International to SA)</SelectItem>
                                <SelectItem value="Domestic">Domestic (SA residents)</SelectItem>
                                <SelectItem value="Outbound">Outbound (SA residents abroad)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Tell customers about your business..."
                        />
                    </div>

                    {/* Business Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="businessPhone">
                            Business Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="businessPhone"
                            type="tel"
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                            required
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
                                        setBusinessWhatsApp(businessPhone);
                                    }
                                }}
                            />
                            <label htmlFor="whatsappSame" className="text-sm text-gray-600 cursor-pointer">
                                Same as business phone
                            </label>
                        </div>

                        {!whatsappSameAsPhone && (
                            <Input
                                id="businessWhatsApp"
                                type="tel"
                                value={businessWhatsApp}
                                onChange={(e) => setBusinessWhatsApp(e.target.value)}
                            />
                        )}

                        {whatsappSameAsPhone && businessPhone && (
                            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded border">
                                WhatsApp: {businessPhone}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}