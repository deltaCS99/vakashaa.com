// components/operator/operator-verification-settings.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  FileText,
  Upload,
  AlertCircle,
  Lock,
  Mail,
  Loader2,
  FileSignature,
  Download,
} from "lucide-react";
import { OperatorProfile } from "@prisma/client";
import { getOperatorStatus, canEditVerificationDocs } from "@/lib/operator";
import { uploadVerificationDoc } from "@/actions/operator/verification";
import { ServiceAgreementDialog } from "./service-agreement-dialog";
import { toast } from "sonner";

interface OperatorVerificationSettingsProps {
  profile: OperatorProfile;
  userName: string;
  userEmail: string;
  onDocsChange: () => void;
}

export function OperatorVerificationSettings({
  profile,
  userName,
  userEmail,
  onDocsChange,
}: OperatorVerificationSettingsProps) {
  const status = getOperatorStatus(profile);
  const canEdit = canEditVerificationDocs(profile);

  const [idDocType, setIdDocType] = useState<"ID" | "Passport">("ID");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);

  const handleFileUpload = async (file: File, type: "cipc" | "id" | "agreement") => {
    if (!file || !canEdit) return;

    setUploadingDoc(type);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);
      formData.append("documentType", type);

      if (type === "id") {
        formData.append("idDocumentType", idDocType);
      }

      const result = await uploadVerificationDoc(formData);

      if (result.success) {
        toast.success("Document uploaded!");
        onDocsChange();
      } else if (!result.success && "error" in result) {
        toast.error(result.error.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(null);
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Status</CardTitle>
            {status === "live" && (
              <Badge className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified & Live
              </Badge>
            )}
            {status === "pending_review" && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Under Review
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "live" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Your business is verified and live!
                  </p>
                  <p className="text-sm text-green-800">
                    You can receive bookings and manage tours.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Your verification is under review. This typically takes 1-2 business days.
              </p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Verification documents are locked
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  For security, documents cannot be changed after submission. Contact support for
                  updates.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@satours.co.za">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CIPC */}
          <div className="space-y-2">
            <Label htmlFor="cipc">
              CIPC Certificate <span className="text-red-500">*</span>
            </Label>
            {profile.companyRegistrationDocument ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-900 flex-1">Uploaded</span>
                <a
                  href={profile.companyRegistrationDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View
                </a>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "cipc");
                  }}
                  className="hidden"
                  id="cipc"
                  disabled={uploadingDoc === "cipc"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploadingDoc === "cipc"}
                >
                  <label htmlFor="cipc" className="cursor-pointer">
                    {uploadingDoc === "cipc" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose PDF
                      </>
                    )}
                  </label>
                </Button>
              </>
            )}
          </div>

          {/* ID/Passport */}
          <div className="space-y-2">
            <Label htmlFor="id">
              ID/Passport <span className="text-red-500">*</span>
            </Label>
            {!profile.idDocument && (
              <Select value={idDocType} onValueChange={(v: any) => setIdDocType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID">South African ID</SelectItem>
                  <SelectItem value="Passport">International Passport</SelectItem>
                </SelectContent>
              </Select>
            )}
            {profile.idDocument ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-900 flex-1">{profile.idDocumentType} Uploaded</span>
                <a
                  href={profile.idDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  View
                </a>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "id");
                  }}
                  className="hidden"
                  id="id"
                  disabled={uploadingDoc === "id"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploadingDoc === "id"}
                >
                  <label htmlFor="id" className="cursor-pointer">
                    {uploadingDoc === "id" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </label>
                </Button>
              </>
            )}
          </div>

          {/* Service Agreement - Digital Signing */}
          <div className="space-y-2">
            <Label htmlFor="agreement">
              Service Agreement <span className="text-red-500">*</span>
            </Label>
            {profile.serviceAgreement ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-900 flex-1">
                    Signed on{" "}
                    {profile.serviceAgreementSignedAt &&
                      new Date(profile.serviceAgreementSignedAt).toLocaleDateString("en-ZA")}
                  </span>
                  <a
                    href={profile.serviceAgreement}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAgreementDialog(true)}
                className="w-full"
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Sign Service Agreement
              </Button>
            )}
          </div >
        </CardContent >
      </Card >

      {/* Service Agreement Dialog */}
      < ServiceAgreementDialog
        profile={profile}
        userName={userName}
        userEmail={userEmail}
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        onSuccess={onDocsChange}
      />
    </>
  );
}