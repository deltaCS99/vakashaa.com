// app/admin/settings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getAllSettings } from "@/actions/admin/settings";
import { SettingsList } from "@/components/admin/settings-list";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
    title: "Settings | Admin",
    description: "Manage system settings",
};

export default async function AdminSettingsPage() {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
        redirect("/");
    }

    const result = await getAllSettings();

    if (!result.success || !("data" in result)) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-600">Failed to load settings</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        Settings
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage key-value settings • {result.data.settings.length} total
                    </p>
                </div>

                {/* Settings List */}
                <SettingsList settings={result.data.settings} />
            </div>
        </div>
    );
}