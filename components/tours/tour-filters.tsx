// components/tours/tour-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, MapPin, Plane } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { getLocalDestinations, getInternationalCountries, getCategories } from "@/actions/tours";

interface TourFiltersProps {
    defaultValues?: {
        localDestination?: string;
        country?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
        search?: string;
    };
}

export function TourFilters({ defaultValues }: TourFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(defaultValues?.search || "");
    const [localDestination, setLocalDestination] = useState(defaultValues?.localDestination || "all");
    const [country, setCountry] = useState(defaultValues?.country || "all");
    const [category, setCategory] = useState(defaultValues?.category || "all");
    const [minPrice, setMinPrice] = useState(defaultValues?.minPrice || "");
    const [maxPrice, setMaxPrice] = useState(defaultValues?.maxPrice || "");

    // State for dynamic data
    const [localDestinations, setLocalDestinations] = useState<string[]>([]);
    const [internationalCountries, setInternationalCountries] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch destinations and categories on component mount
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                setIsLoading(true);

                // Fetch local, international, and categories in parallel
                const [localResponse, internationalResponse, categoriesResponse] = await Promise.all([
                    getLocalDestinations(),
                    getInternationalCountries(),
                    getCategories()
                ]);

                if (localResponse.success && 'data' in localResponse) {
                    setLocalDestinations(localResponse.data.destinations);
                }

                if (internationalResponse.success && 'data' in internationalResponse) {
                    setInternationalCountries(internationalResponse.data.countries);
                }

                if (categoriesResponse.success && 'data' in categoriesResponse) {
                    setCategories(categoriesResponse.data.categories);
                }
            } catch (error) {
                console.error("Error fetching filter data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilterData();
    }, []);

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (search) params.set("search", search);
        else params.delete("search");

        // Handle local destination
        if (localDestination && localDestination !== "all") {
            params.set("localDestination", localDestination);
            params.delete("country"); // Clear country if local is selected
        } else {
            params.delete("localDestination");
        }

        // Handle international country
        if (country && country !== "all") {
            params.set("country", country);
            params.delete("localDestination"); // Clear local if country is selected
        } else {
            params.delete("country");
        }

        if (category && category !== "all") params.set("category", category);
        else params.delete("category");

        if (minPrice) params.set("minPrice", minPrice);
        else params.delete("minPrice");

        if (maxPrice) params.set("maxPrice", maxPrice);
        else params.delete("maxPrice");

        params.delete("page"); // Reset to page 1

        router.push(`/?${params.toString()}`);
    };

    const handleClear = () => {
        setSearch("");
        setLocalDestination("all");
        setCountry("all");
        setCategory("all");
        setMinPrice("");
        setMaxPrice("");
        router.push("/");
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter();
    };

    // When local destination is selected, clear country
    const handleLocalDestinationChange = (value: string) => {
        setLocalDestination(value);
        if (value !== "all") {
            setCountry("all");
        }
    };

    // When country is selected, clear local destination
    const handleCountryChange = (value: string) => {
        setCountry(value);
        if (value !== "all") {
            setLocalDestination("all");
        }
    };

    return (
        <div className="py-4 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Search tours..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit">Search</Button>
            </form>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4 flex-wrap">
                {/* Local Destinations (South Africa) */}
                <Select
                    value={localDestination}
                    onValueChange={handleLocalDestinationChange}
                    disabled={isLoading || country !== "all"}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="🇿🇦 Local" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Local</SelectItem>
                        {localDestinations.map((dest) => (
                            <SelectItem key={dest} value={dest}>
                                {dest}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* International Countries */}
                <Select
                    value={country}
                    onValueChange={handleCountryChange}
                    disabled={isLoading || localDestination !== "all"}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="✈️ International" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {internationalCountries.map((countryName) => (
                            <SelectItem key={countryName} value={countryName}>
                                {countryName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Category */}
                <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Price Range */}
                <div className="flex gap-2 items-center">
                    <Input
                        type="number"
                        placeholder="Min price"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-[120px]"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                        type="number"
                        placeholder="Max price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-[120px]"
                    />
                </div>

                <Button onClick={handleFilter} variant="default">
                    Apply Filters
                </Button>

                {(search || localDestination !== "all" || country !== "all" || category !== "all" || minPrice || maxPrice) && (
                    <Button onClick={handleClear} variant="outline">
                        Clear
                    </Button>
                )}
            </div>

            {/* Mobile Filters */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Filter Tours</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">🇿🇦 Local (South Africa)</label>
                                <Select
                                    value={localDestination}
                                    onValueChange={handleLocalDestinationChange}
                                    disabled={isLoading || country !== "all"}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Local" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Local</SelectItem>
                                        {localDestinations.map((dest) => (
                                            <SelectItem key={dest} value={dest}>
                                                {dest}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">✈️ International</label>
                                <Select
                                    value={country}
                                    onValueChange={handleCountryChange}
                                    disabled={isLoading || localDestination !== "all"}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Countries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {internationalCountries.map((countryName) => (
                                            <SelectItem key={countryName} value={countryName}>
                                                {countryName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Category</label>
                                <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Price Range (R)</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                    />
                                    <span className="text-gray-400">-</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button onClick={handleClear} variant="outline" className="flex-1">
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}