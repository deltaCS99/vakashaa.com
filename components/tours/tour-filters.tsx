// components/tours/tour-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Search,
    SlidersHorizontal,
    Building2,
    Mountain,
    Wine,
    Package,
    Compass,
    Binoculars,
} from "lucide-react";
import { useState, useEffect, ElementType, useRef } from "react";
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Fetch destinations and categories on component mount
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
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
            }
        };

        fetchFilterData();
    }, []);

    useEffect(() => {
        if (isDialogOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDialogOpen]);

    const handleFilter = (overrides?: {
        search?: string;
        localDestination?: string;
        country?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
    }) => {
        const nextSearch = overrides?.search ?? search;
        const nextLocalDestination = overrides?.localDestination ?? localDestination;
        const nextCountry = overrides?.country ?? country;
        const nextCategory = overrides?.category ?? category;
        const nextMinPrice = overrides?.minPrice ?? minPrice;
        const nextMaxPrice = overrides?.maxPrice ?? maxPrice;

        const params = new URLSearchParams(searchParams.toString());

        if (nextSearch) params.set("search", nextSearch);
        else params.delete("search");

        // Handle local destination
        if (nextLocalDestination && nextLocalDestination !== "all") {
            params.set("localDestination", nextLocalDestination);
            params.delete("country"); // Clear country if local is selected
        } else {
            params.delete("localDestination");
        }

        // Handle international country
        if (nextCountry && nextCountry !== "all") {
            params.set("country", nextCountry);
            params.delete("localDestination"); // Clear local if country is selected
        } else {
            params.delete("country");
        }

        if (nextCategory && nextCategory !== "all") params.set("category", nextCategory);
        else params.delete("category");

        if (nextMinPrice) params.set("minPrice", nextMinPrice);
        else params.delete("minPrice");

        if (nextMaxPrice) params.set("maxPrice", nextMaxPrice);
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

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        handleFilter();
        setIsDialogOpen(false);
    };

    const handleLocalDestinationChange = (value: string) => {
        const nextValue = localDestination === value ? "all" : value;
        setLocalDestination(nextValue);
        if (nextValue !== "all") {
            setCountry("all");
        }
        handleFilter({ localDestination: nextValue, country: "all" });
    };

    const handleCountryChange = (value: string) => {
        const nextValue = country === value ? "all" : value;
        setCountry(nextValue);
        if (nextValue !== "all") {
            setLocalDestination("all");
        }
        handleFilter({ country: nextValue, localDestination: "all" });
    };

    const categoryIconMap: Record<string, ElementType> = {
        "safari": Binoculars,
        "city tour": Building2,
        "scenic tour": Mountain,
        "wine tour": Wine,
        "package tour": Package,
    };

    const quickCategoryChips = categories.map((cat) => {
        const Icon = categoryIconMap[cat.toLowerCase()] || Compass;
        return { label: cat, value: cat, icon: Icon };
    });

    const handleCategoryChip = (value: string) => {
        const nextValue = category === value ? "all" : value;
        setCategory(nextValue);
        handleFilter({ category: nextValue });
    };

    const pillBase =
        "h-10 rounded-full border text-sm font-medium transition whitespace-nowrap px-3 inline-flex items-center gap-2";
    const pillActive = "border-slate-900 bg-slate-900 text-white";
    const pillInactive = "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";

    const openDialog = () => {
        setIsDialogOpen(true);
    };

    const clearAndClose = () => {
        handleClear();
        setIsDialogOpen(false);
    };

    return (
        <div className="py-4 space-y-3">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    {/* Categories left, scrollable */}
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {quickCategoryChips.map(({ label, value, icon: Icon }) => {
                            const isActive = category === value;
                            return (
                                <button
                                    key={`cat-${value}`}
                                    type="button"
                                    onClick={() => handleCategoryChip(value)}
                                    className={`${pillBase} ${isActive ? pillActive : pillInactive} shrink-0 snap-start`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filters right */}
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            className={`${pillBase} ${pillInactive}`}
                            onClick={openDialog}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl shadow-none border border-slate-200">
                    <DialogHeader className="pb-2">
                        <DialogTitle>Filters</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                        <form onSubmit={handleSearchSubmit} className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-800">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search tours..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>

                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">Local (South Africa)</Label>
                                <div className="space-y-2">
                                    {localDestinations.map((dest) => (
                                        <label key={dest} className="flex items-center gap-3 text-sm text-slate-700">
                                            <Checkbox
                                                checked={localDestination === dest}
                                                onCheckedChange={() => handleLocalDestinationChange(dest)}
                                            />
                                            <span>{dest}</span>
                                        </label>
                                    ))}
                                    <label className="flex items-center gap-3 text-sm text-slate-600">
                                        <Checkbox
                                            checked={localDestination === "all"}
                                            onCheckedChange={() => handleLocalDestinationChange("all")}
                                        />
                                        <span>All Local</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">International</Label>
                                <div className="space-y-2">
                                    {internationalCountries.map((ctry) => (
                                        <label key={ctry} className="flex items-center gap-3 text-sm text-slate-700">
                                            <Checkbox
                                                checked={country === ctry}
                                                onCheckedChange={() => handleCountryChange(ctry)}
                                            />
                                            <span>{ctry}</span>
                                        </label>
                                    ))}
                                    <label className="flex items-center gap-3 text-sm text-slate-600">
                                        <Checkbox
                                            checked={country === "all"}
                                            onCheckedChange={() => handleCountryChange("all")}
                                        />
                                        <span>All Countries</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-800">Categories</Label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {categories.map((cat) => (
                                    <label key={cat} className="flex items-center gap-3 text-sm text-slate-700">
                                        <Checkbox
                                            checked={category === cat}
                                            onCheckedChange={() => handleCategoryChip(cat)}
                                        />
                                        <span>{cat}</span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-3 text-sm text-slate-600">
                                    <Checkbox
                                        checked={category === "all"}
                                        onCheckedChange={() => handleCategoryChip("all")}
                                    />
                                    <span>All Categories</span>
                                </label>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-800">Price (R)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                                <span className="text-slate-400">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Button variant="ghost" onClick={clearAndClose}>
                            Clear
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSearchSubmit}>Show results</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
