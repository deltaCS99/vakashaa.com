// components/operator/operator-business-switcher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2 } from "lucide-react";
import { OperatorApplicationForm } from "./operator-application-form";

interface OperatorBusinessSwitcherProps {
    profiles: Array<{
        id: string;
        businessName: string;
        isApproved: boolean;
    }>;
    currentProfileId: string;
}

export function OperatorBusinessSwitcher({
    profiles,
    currentProfileId,
}: OperatorBusinessSwitcherProps) {
    const router = useRouter();
    const [showAddDialog, setShowAddDialog] = useState(false);

    const handleBusinessChange = (profileId: string) => {
        router.push(`/operator/dashboard?business=${profileId}`);
    };

    const handleAddSuccess = () => {
        setShowAddDialog(false);
        router.refresh();
    };

    return (
        <>
            <div className="flex items-center gap-3">
                {/* Business Selector */}
                <Select value={currentProfileId} onValueChange={handleBusinessChange}>
                    <SelectTrigger className="w-[300px]">
                        <Building2 className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                                <div className="flex items-center justify-between w-full">
                                    <span>{profile.businessName}</span>
                                    <Badge variant="outline" className="ml-2">
                                        {profile.isApproved ? "Live" : "Draft"}
                                    </Badge>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Add Business Button */}
                <Button onClick={() => setShowAddDialog(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Business
                </Button>
            </div>

            {/* Add Business Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Another Business</DialogTitle>
                        <DialogDescription>
                            Create another operator profile under your account
                        </DialogDescription>
                    </DialogHeader>
                    <OperatorApplicationForm
                        userId={profiles[0]?.id} // Get userId from existing profile
                        isDialog={true}
                        onSuccess={handleAddSuccess}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}