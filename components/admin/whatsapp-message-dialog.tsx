// components/admin/whatsapp-message-dialog.tsx
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { sendOperatorWhatsApp } from "@/actions/admin/operators";
import { toast } from "sonner";
import { WHATSAPP_TEMPLATES } from "@/utils/whatsapp";

interface WhatsAppMessageDialogProps {
    operatorId: string;
    operatorName: string;
    whatsappNumber: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MESSAGE_TEMPLATES = {
    quality_control: {
        label: "Quality Control - Tours",
        type: "quality_control" as const,
        getMessage: (name: string) =>
            WHATSAPP_TEMPLATES.operator.quality_control(name, [
                "Tour titles should be more descriptive",
                "Tour descriptions need more detail",
                "Add more images (min 5 per tour)",
            ]),
    },
    image_quality: {
        label: "Image Quality Issues",
        type: "quality_control" as const,
        getMessage: (name: string) => WHATSAPP_TEMPLATES.operator.image_quality(name),
    },
    rejection_reason: {
        label: "Application Rejection",
        type: "rejection" as const,
        getMessage: (name: string) =>
            WHATSAPP_TEMPLATES.operator.application_rejected(name, "[Specify reason here]"),
    },
    bank_rejection: {
        label: "Bank Details Rejection",
        type: "bank_rejection" as const,
        getMessage: (name: string) =>
            WHATSAPP_TEMPLATES.operator.bank_rejected(name, "[Specify reason here]"),
    },
    approval: {
        label: "Application Approved",
        type: "approval" as const,
        getMessage: (name: string) => WHATSAPP_TEMPLATES.operator.application_approved(name),
    },
    bank_approval: {
        label: "Bank Details Approved",
        type: "approval" as const,
        getMessage: (name: string) => WHATSAPP_TEMPLATES.operator.bank_approved(name),
    },
    general: {
        label: "Custom Message",
        type: "general" as const,
        getMessage: (name: string) => `Hi ${name},\n\n`,
    },
};

export function WhatsAppMessageDialog({
    operatorId,
    operatorName,
    whatsappNumber,
    open,
    onOpenChange,
}: WhatsAppMessageDialogProps) {
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>("general");
    const [message, setMessage] = useState("");

    const handleTemplateChange = (value: keyof typeof MESSAGE_TEMPLATES) => {
        setTemplate(value);
        const templateMessage = MESSAGE_TEMPLATES[value].getMessage(operatorName);
        setMessage(templateMessage);
    };

    const handleSendMessage = async () => {
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        if (!whatsappNumber) {
            toast.error("Operator has no WhatsApp number on file");
            return;
        }

        setLoading(true);
        const result = await sendOperatorWhatsApp({
            operatorId,
            message: message.trim(),
            type: MESSAGE_TEMPLATES[template].type,
        });
        setLoading(false);

        if (result.success) {
            toast.success("WhatsApp message sent! ✅");
            onOpenChange(false);
            setMessage("");
            setTemplate("general");
        } else {
            toast.error(result.error?.message || "Failed to send message");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Send WhatsApp Notification
                    </DialogTitle>
                    <DialogDescription>
                        Send message to {operatorName} via Twilio WhatsApp
                        {whatsappNumber && (
                            <>
                                {" "}
                                • <span className="font-mono">{whatsappNumber}</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Template Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="template">Message Template</Label>
                        <Select
                            value={template}
                            onValueChange={(value) =>
                                handleTemplateChange(value as keyof typeof MESSAGE_TEMPLATES)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(MESSAGE_TEMPLATES).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message Input */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={12}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 Message will be sent via Twilio WhatsApp. Operator will receive it on their
                            WhatsApp.
                        </p>
                    </div>

                    {/* Character count */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Characters: {message.length}</span>
                        {message.length > 1600 && (
                            <span className="text-orange-600">⚠️ Long messages may be split</span>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendMessage}
                        disabled={loading || !message.trim() || !whatsappNumber}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send WhatsApp Message
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}