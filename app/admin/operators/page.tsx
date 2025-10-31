// app/admin/operators/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getOperators } from "@/actions/admin/operators";
import { OperatorsTable } from "@/components/admin/operators-table";
import { OperatorsFilters } from "@/components/admin/operators-filters";

export const metadata: Metadata = {
    title: "Operators Management | Admin",
    description: "Manage tour operators and applications",
};

interface OperatorsPageProps {
    searchParams: {
        status?: "all" | "pending" | "approved";
        search?: string;
        page?: string;
    };
}

export default async function OperatorsPage({ searchParams }: OperatorsPageProps) {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
        redirect("/");
    }

    const result = await getOperators({
        status: searchParams.status || "all",
        search: searchParams.search,
        page: searchParams.page ? parseInt(searchParams.page) : 1,
    });

    if (!result.success || !("data" in result)) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-600">Failed to load operators</p>
                </div>
            </div>
        );
    }

    const { operators, totalPages, currentPage } = result.data;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Operators Management</h1>
                    <p className="text-gray-600 mt-2">
                        Review and manage tour operator applications
                    </p>
                </div>

                {/* Filters */}
                <OperatorsFilters
                    currentStatus={searchParams.status || "all"}
                    currentSearch={searchParams.search}
                />

                {/* Operators Table */}
                <OperatorsTable
                    operators={operators}
                    totalPages={totalPages}
                    currentPage={currentPage}
                />
            </div>
        </div>
    );
}