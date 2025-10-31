// components/admin/operators-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface OperatorsFiltersProps {
    currentStatus: string;
    currentSearch?: string;
}

export function OperatorsFilters({ currentStatus, currentSearch }: OperatorsFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(currentSearch || "");

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams();
        params.set("status", status);
        params.delete("page");
        router.push(`/admin/operators?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) {
            params.set("search", search);
        } else {
            params.delete("search");
        }
        params.delete("page");
        router.push(`/admin/operators?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearch("");
        router.push("/admin/operators");
    };

    const hasFilters = currentStatus !== "all" || currentSearch;

    return (
        <div className="space-y-4 mb-6">
            {/* Status Tabs */}
            <Tabs value={currentStatus} onValueChange={handleStatusChange}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search */}
            <div className="flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by business name, operator name, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
                {hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}