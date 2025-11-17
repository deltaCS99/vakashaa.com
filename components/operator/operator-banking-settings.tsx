// components/operator/operator-banking-settings.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { OperatorProfile } from "@prisma/client";
import { saveBankDetails, uploadBankDoc } from "@/actions/operator/banking";
import { toast } from "sonner";

interface OperatorBankingSettingsProps {
  profile: OperatorProfile;
  onDocsChange: () => void;
}

export function OperatorBankingSettings({
  profile,
  onDocsChange,
}: OperatorBankingSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [bankName, setBankName] = useState(profile.bankName || "");
  const [bankCode, setBankCode] = useState(profile.bankCode || "");
  const [accountNumber, setAccountNumber] = useState(profile.accountNumber || "");
  const [accountName, setAccountName] = useState(profile.accountName || "");

  const verificationStatus = profile.bankVerificationStatus;
  const isApproved = profile.isApproved;

  // Check if bank details changed
  const bankDetailsChanged =
    bankCode !== (profile.bankCode || "") ||
    accountNumber !== (profile.accountNumber || "") ||
    accountName !== (profile.accountName || "");

  const handleSaveBankDetails = async () => {
    if (!bankCode || !accountNumber || !accountName) {
      toast.error("Please fill in all required bank details");
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveBankDetails({
        profileId: profile.id,
        bankName: bankName.trim() || undefined,
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });

      if (result.success) {
        toast.success("Bank details saved!");
        onDocsChange();
      } else if (!result.success && "error" in result) {
        toast.error(result.error.message || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);

      const result = await uploadBankDoc(formData);

      if (result.success) {
        toast.success("Bank document uploaded!");
        onDocsChange();
      } else if (!result.success && "error" in result) {
        toast.error(result.error.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      {verificationStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bank Verification Status</CardTitle>
              {verificationStatus === "Approved" && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {verificationStatus === "Pending" && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Under Review
                </Badge>
              )}
              {verificationStatus === "Rejected" && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {verificationStatus === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Bank details verified
                    </p>
                    <p className="text-sm text-green-800">
                      Payouts will be sent to this account. You can update your bank details anytime,
                      but changes require re-verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {verificationStatus === "Pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">
                      Bank verification in progress
                    </p>
                    <p className="text-sm text-yellow-800">
                      Your bank details are being verified. This typically takes 1-2 business days.
                      {isApproved && " Your tours will remain live during verification."}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {verificationStatus === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-1">
                      Bank verification rejected
                    </p>
                    <p className="text-sm text-red-800 mb-2">
                      Please update your bank details and resubmit.
                    </p>
                    {profile.bankVerificationNotes && (
                      <p className="text-sm text-red-700 font-medium bg-red-100 p-2 rounded">
                        Reason: {profile.bankVerificationNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Re-verification Warning */}
      {isApproved && bankDetailsChanged && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900 mb-1">
                  Bank details changed
                </p>
                <p className="text-sm text-orange-800">
                  Changes will require re-verification. Save your changes, then submit for review.
                  Your tours will remain visible during the process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., FNB"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCode">
                Branch Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bankCode"
                placeholder="250655"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              Account Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              placeholder="62xxxxxxxxx"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">
              Account Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountName"
              placeholder="Must match business registration"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <p className="text-xs text-gray-500">Must match your registered business name</p>
          </div>

          <Button
            onClick={handleSaveBankDetails}
            disabled={isSaving || (!bankCode && !accountNumber && !accountName)}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Bank Details"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bank Verification Document */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Verification Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a bank statement or confirmation letter showing your account details
          </p>

          {profile.bankVerificationDocument ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-900 flex-1">Document uploaded</span>
                <a
                  href={profile.bankVerificationDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View
                </a>
              </div>

              {/* Allow re-upload */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600 mb-2">Need to upload a new document?</p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  id="bank-doc-re-upload"
                  disabled={uploadingDoc}
                />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={uploadingDoc}
                >
                  <label htmlFor="bank-doc-re-upload" className="cursor-pointer">
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Replace Document
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="bank-doc-upload"
                disabled={uploadingDoc}
              />
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={uploadingDoc}
              >
                <label htmlFor="bank-doc-upload" className="cursor-pointer">
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File (PDF or Image)
                    </>
                  )}
                </label>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}