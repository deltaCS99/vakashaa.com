// components/admin/settings-list.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { createSetting, updateSetting, deleteSetting } from "@/actions/admin/settings";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Setting {
    key: string;
    value: string;
    updatedAt: Date;
}

interface SettingsListProps {
    settings: Setting[];
}

export function SettingsList({ settings: initialSettings }: SettingsListProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        initialSettings.forEach((s) => {
            initial[s.key] = s.value;
        });
        return initial;
    });

    // New setting dialog
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");

    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

    const handleChange = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string) => {
        setLoading(key);
        const result = await updateSetting({ key, value: values[key] });
        setLoading(null);

        if (result.success) {
            toast.success("Setting updated");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to update");
        }
    };

    const handleCreate = async () => {
        if (!newKey.trim()) {
            toast.error("Key is required");
            return;
        }

        setLoading("new");
        const result = await createSetting({ key: newKey.trim(), value: newValue });
        setLoading(null);

        if (result.success) {
            toast.success("Setting created");
            setShowNewDialog(false);
            setNewKey("");
            setNewValue("");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to create");
        }
    };

    const handleDelete = async (key: string) => {
        setLoading(key);
        const result = await deleteSetting(key);
        setLoading(null);
        setDeleteDialog(null);

        if (result.success) {
            toast.success("Setting deleted");
            router.refresh();
        } else {
            toast.error(result.error?.message || "Failed to delete");
        }
    };

    return (
        <>
            {/* Add New Button */}
            <div className="mb-6">
                <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Setting
                </Button>
            </div>

            {/* Settings List */}
            <div className="space-y-4">
                {initialSettings.map((setting) => (
                    <Card key={setting.key}>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Label className="font-mono text-sm font-semibold">{setting.key}</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Updated {formatDistanceToNow(new Date(setting.updatedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteDialog(setting.key)}
                                        disabled={loading === setting.key}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <Textarea
                                        value={values[setting.key] || ""}
                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                        rows={3}
                                        className="flex-1 font-mono text-sm"
                                    />
                                    <Button
                                        onClick={() => handleSave(setting.key)}
                                        disabled={loading === setting.key}
                                        className="self-start"
                                    >
                                        {loading === setting.key ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {initialSettings.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">No settings yet. Add your first setting above.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* New Setting Dialog */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Setting</DialogTitle>
                        <DialogDescription>Create a new key-value setting</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">Key *</Label>
                            <Input
                                id="key"
                                placeholder="e.g., site.name or payment.commission"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use dot notation for organization (e.g., category.name)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Value</Label>
                            <Textarea
                                id="value"
                                placeholder="Enter value..."
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                rows={4}
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={loading === "new" || !newKey.trim()}>
                            {loading === "new" ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Setting"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Setting</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the setting{" "}
                            <span className="font-mono font-semibold">{deleteDialog}</span>? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteDialog && handleDelete(deleteDialog)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}