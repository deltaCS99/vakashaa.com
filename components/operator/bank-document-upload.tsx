// components/operator/bank-document-upload.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2, ExternalLink } from "lucide-react";
import { uploadBankVerificationDocument } from "@/lib/upload";
import { toast } from "sonner";

interface BankDocumentUploadProps {
    documentUrl: string | null;
    onDocumentChange: (url: string | null) => void;
    operatorProfileId: string;
    disabled?: boolean;
}

export function BankDocumentUpload({
    documentUrl,
    onDocumentChange,
    operatorProfileId,
    disabled = false,
}: BankDocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload PDF, JPG, PNG, or WebP files.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10MB.");
            return;
        }

        setIsUploading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");

            const result = await uploadBankVerificationDocument(
                { name: file.name, type: file.type, size: file.size, data: base64 },
                operatorProfileId
            );

            if (result.success && result.url) {
                onDocumentChange(result.url);
                toast.success("Document uploaded successfully");
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload document");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getFileName = (url: string) => url.split("/").pop() || "Document";

    if (isUploading) {
        return (
            <div className="border rounded-lg p-6 text-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
            </div>
        );
    }

    if (documentUrl) {
        return (
            <div className="border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{getFileName(documentUrl)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="ghost" asChild>
                        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                    {!disabled && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onDocumentChange(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={`w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors ${disabled
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                    : "border-gray-300 hover:border-primary hover:bg-primary/5"
                    }`}
            >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                    {disabled ? "Upload disabled" : "Upload verification document"}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG or WebP • Max 10MB</p>
            </button>
            <p className="text-xs text-gray-500 mt-2">
                <span className="text-red-500">*</span> Required: Bank statement or confirmation letter
            </p>
        </div>
    );
}