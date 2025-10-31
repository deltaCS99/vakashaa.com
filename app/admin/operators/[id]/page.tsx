// app/admin/operators/[id]/page.tsx
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperatorById } from "@/actions/admin/operators";
import { OperatorDetails } from "@/components/admin/operator-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Operator Details | Admin",
};

interface OperatorDetailPageProps {
    params: {
        id: string;
    };
}

export default async function OperatorDetailPage({ params }: OperatorDetailPageProps) {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
        redirect("/");
    }

    const result = await getOperatorById(params.id);

    if (!result.success || !("data" in result)) {
        notFound();
    }

    const { operator } = result.data;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-6">
                    <Link href="/admin/operators">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Operators
                    </Link>
                </Button>

                {/* Operator Details */}
                <OperatorDetails operator={operator} />
            </div>
        </div>
    );
}