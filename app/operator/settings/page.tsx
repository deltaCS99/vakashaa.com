// app/operator/settings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorProfile, getOperatorProfiles } from "@/lib/operator";
import { OperatorBusinessSwitcher } from "@/components/operator/operator-business-switcher";
import { OperatorSettingsTabs } from "@/components/operator/operator-settings-tabs";

export const metadata: Metadata = {
  title: "Settings | SA Tours Operator",
  description: "Manage your operator account settings",
};

interface PageProps {
  searchParams: {
    business?: string;
    tab?: string;
  };
}

export default async function OperatorSettingsPage({ searchParams }: PageProps) {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    redirect("/login");
  }

  const allProfiles = await getOperatorProfiles();
  const currentProfile = await getOperatorProfile(searchParams.business);

  if (!currentProfile) {
    redirect("/operator/apply");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your business profile and verification</p>
          </div>
          <OperatorBusinessSwitcher
            profiles={allProfiles}
            currentProfileId={currentProfile.id}
          />
        </div>

        {/* Settings Tabs */}
        <OperatorSettingsTabs
          profile={currentProfile}
          userName={user.name || ""}
          userEmail={user.email || ""}
          defaultTab={searchParams.tab}
        />
      </div>
    </div>
  );
}