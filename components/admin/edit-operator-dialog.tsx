// components/admin/edit-operator-dialog.tsx
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { updateOperator } from "@/actions/admin/operators";
import { toast } from "sonner";

interface EditOperatorDialogProps {
    operator: {
        id: string;
        businessName: string;
        businessPhone: string | null;
        businessWhatsApp: string | null;
        description: string | null;
        operatorType: "TourOperator" | "DMC";
        serviceType: "Inbound" | "Domestic" | "Outbound" | "All";
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditOperatorDialog({
    operator,
    open,
    onOpenChange,
}: EditOperatorDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: operator.businessName,
        businessPhone: operator.businessPhone || "",
        businessWhatsApp: operator.businessWhatsApp || "",
        description: operator.description || "",
        operatorType: operator.operatorType as "TourOperator" | "DMC",
        serviceType: operator.serviceType as "Inbound" | "Domestic" | "Outbound" | "All",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateOperator({
            operatorId: operator.id,
            businessName: formData.businessName,
            businessPhone: formData.businessPhone || null,
            businessWhatsApp: formData.businessWhatsApp || null,
            description: formData.description || null,
            operatorType: formData.operatorType,
            serviceType: formData.serviceType,
        });

        setLoading(false);

        if (result.success) {
            toast.success("Operator updated successfully");
            router.refresh();
            onOpenChange(false);
        } else {
            toast.error(result.error?.message || "Failed to update operator");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Operator</DialogTitle>
                    <DialogDescription>
                        Update operator business information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Business Name */}
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                            id="businessName"
                            value={formData.businessName}
                            onChange={(e) =>
                                setFormData({ ...formData, businessName: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Business Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                            id="businessPhone"
                            type="tel"
                            value={formData.businessPhone}
                            onChange={(e) =>
                                setFormData({ ...formData, businessPhone: e.target.value })
                            }
                            placeholder="+27 12 345 6789"
                        />
                    </div>

                    {/* Business WhatsApp */}
                    <div className="space-y-2">
                        <Label htmlFor="businessWhatsApp">Business WhatsApp</Label>
                        <Input
                            id="businessWhatsApp"
                            type="tel"
                            value={formData.businessWhatsApp}
                            onChange={(e) =>
                                setFormData({ ...formData, businessWhatsApp: e.target.value })
                            }
                            placeholder="+27 82 345 6789"
                        />
                    </div>

                    {/* Operator Type */}
                    <div className="space-y-2">
                        <Label htmlFor="operatorType">Operator Type *</Label>
                        <Select
                            value={formData.operatorType}
                            onValueChange={(value: "TourOperator" | "DMC") =>
                                setFormData({ ...formData, operatorType: value })
                            }
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
                        <Label htmlFor="serviceType">Service Type *</Label>
                        <Select
                            value={formData.serviceType}
                            onValueChange={(value: "Inbound" | "Domestic" | "Outbound" | "All") =>
                                setFormData({ ...formData, serviceType: value })
                            }
                        >
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

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={4}
                            placeholder="Describe your business, services, and expertise..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}