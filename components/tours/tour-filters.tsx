// components/tours/tour-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    X,
} from "lucide-react";
import { useState, useEffect, ElementType, useRef, useTransition } from "react";
import { getLocalDestinations, getInternationalCountries, getCategories } from "@/actions/tours";
import { type ScopeValue } from "@/lib/scope";
import { TourGridSkeleton } from "./tour-grid-skeleton";

interface TourFiltersProps {
    defaultValues?: {
        localDestination?: string;
        country?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    durationRange?: string;
    priceRange?: string;
    };
    scope: ScopeValue;
}

export function TourFilters({ defaultValues, scope }: TourFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(defaultValues?.search || "");
    const [localDestinationsSelected, setLocalDestinationsSelected] = useState<string[]>(
        defaultValues?.localDestination ? defaultValues.localDestination.split(",").filter(Boolean) : []
    );
    const [countriesSelected, setCountriesSelected] = useState<string[]>(
        defaultValues?.country ? defaultValues.country.split(",").filter(Boolean) : []
    );
    const [categoriesSelected, setCategoriesSelected] = useState<string[]>(
        defaultValues?.category ? defaultValues.category.split(",").filter(Boolean) : []
    );
    const [minPrice, setMinPrice] = useState(defaultValues?.minPrice || "");
    const [maxPrice, setMaxPrice] = useState(defaultValues?.maxPrice || "");
    const [durationRange, setDurationRange] = useState(defaultValues?.durationRange || "all");
    const [priceRange, setPriceRange] = useState(defaultValues?.priceRange || "all");

    // State for dynamic data
    const [localDestinations, setLocalDestinations] = useState<string[]>([]);
    const [internationalCountries, setInternationalCountries] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Sync state when URL defaults change (e.g., scope toggle)
    useEffect(() => {
        setSearch(defaultValues?.search || "");
        setLocalDestinationsSelected(defaultValues?.localDestination ? defaultValues.localDestination.split(",").filter(Boolean) : []);
        setCountriesSelected(defaultValues?.country ? defaultValues.country.split(",").filter(Boolean) : []);
        setCategoriesSelected(defaultValues?.category ? defaultValues.category.split(",").filter(Boolean) : []);
        setMinPrice(defaultValues?.minPrice || "");
        setMaxPrice(defaultValues?.maxPrice || "");
        setDurationRange(defaultValues?.durationRange || "all");
        setPriceRange(defaultValues?.priceRange || "all");
    }, [
        defaultValues?.search,
        defaultValues?.localDestination,
        defaultValues?.country,
        defaultValues?.category,
        defaultValues?.minPrice,
        defaultValues?.maxPrice,
        defaultValues?.durationRange,
        defaultValues?.priceRange,
    ]);

    // Fetch destinations and categories when scope changes
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                // Fetch local, international, and categories in parallel
                const [localResponse, internationalResponse, categoriesResponse] = await Promise.all([
                    getLocalDestinations(),
                    getInternationalCountries(),
                    getCategories(scope)
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
    }, [scope]);

    // Reset categories that no longer exist for the current scope (state only)
    useEffect(() => {
        if (categories.length === 0) return;
        const valid = categoriesSelected.filter((c) => categories.includes(c));
        if (valid.length !== categoriesSelected.length) {
            setCategoriesSelected(valid);
        }
    }, [categories, categoriesSelected]);

    useEffect(() => {
        if (isDialogOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDialogOpen]);

    const applyFilters = (overrides?: {
        search?: string;
        localDestinationsSelected?: string[];
        countriesSelected?: string[];
        categoriesSelected?: string[];
        minPrice?: string;
        maxPrice?: string;
        durationRange?: string;
        priceRange?: string;
    }) => {
        const nextSearch = overrides?.search ?? search;
        const nextLocalDestinations = overrides?.localDestinationsSelected ?? localDestinationsSelected;
        const nextCountries = overrides?.countriesSelected ?? countriesSelected;
        const nextCategories = overrides?.categoriesSelected ?? categoriesSelected;
        const nextMinPrice = overrides?.minPrice ?? minPrice;
        const nextMaxPrice = overrides?.maxPrice ?? maxPrice;
        const nextDuration = overrides?.durationRange ?? durationRange;
        const nextPriceRange = overrides?.priceRange ?? priceRange;

        const params = new URLSearchParams(searchParams.toString());

        if (nextSearch) params.set("search", nextSearch);
        else params.delete("search");

        // Handle local destinations (multi)
        if (nextLocalDestinations.length > 0) {
            params.set("localDestination", nextLocalDestinations.join(","));
        } else {
            params.delete("localDestination");
        }

        // Handle international countries (multi)
        if (nextCountries.length > 0) {
            params.set("country", nextCountries.join(","));
        } else {
            params.delete("country");
        }

        // Categories (multi)
        if (nextCategories.length > 0) params.set("category", nextCategories.join(","));
        else params.delete("category");

        if (nextPriceRange && nextPriceRange !== "all") {
            params.set("priceRange", nextPriceRange);
            params.delete("minPrice");
            params.delete("maxPrice");
        } else {
            params.delete("priceRange");
            if (nextMinPrice) params.set("minPrice", nextMinPrice);
            else params.delete("minPrice");

            if (nextMaxPrice) params.set("maxPrice", nextMaxPrice);
            else params.delete("maxPrice");
        }

        if (nextDuration && nextDuration !== "all") params.set("durationRange", nextDuration);
        else params.delete("durationRange");

        params.delete("page"); // Reset to page 1

        const queryString = params.toString();
        startTransition(() => {
            router.push(queryString ? `/?${queryString}` : "/");
        });
    };

    const handleClear = () => {
        setSearch("");
        setLocalDestinationsSelected([]);
        setCountriesSelected([]);
        setCategoriesSelected([]);
        setMinPrice("");
        setMaxPrice("");
        setDurationRange("all");
        setPriceRange("all");
        startTransition(() => router.push("/"));
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        applyFilters();
        setIsDialogOpen(false);
    };

    const toggleSelection = (current: string[], value: string) =>
        current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

    const handleLocalDestinationChange = (value: string) => {
        const next = value === "all" ? [] : toggleSelection(localDestinationsSelected, value);
        setLocalDestinationsSelected(next);
    };

    const handleCountryChange = (value: string) => {
        const next = value === "all" ? [] : toggleSelection(countriesSelected, value);
        setCountriesSelected(next);
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

    const durationFilters = [
        { label: "Weekend (1-3d)", value: "weekend" },
        { label: "Short (4-7d)", value: "short" },
        { label: "Extended (8-14d)", value: "extended" },
        { label: "Expedition (15d+)", value: "expedition" },
    ];

    const priceFilters = [
        { label: "Under R5k", value: "budget" },
        { label: "R5k - R10k", value: "comfort" },
        { label: "R10k - R20k", value: "premium" },
        { label: "R20k+", value: "luxury" },
    ];

    const handleCategoryChip = (value: string) => {
        const next = toggleSelection(categoriesSelected, value);
        setCategoriesSelected(next);
    };

    const handleDurationChange = (value: string) => {
        const nextValue = durationRange === value ? "all" : value;
        setDurationRange(nextValue);
    };

    const handlePriceRangeChange = (value: string) => {
        const nextValue = priceRange === value ? "all" : value;
        setPriceRange(nextValue);
        if (nextValue !== "all") {
            setMinPrice("");
            setMaxPrice("");
        }
    };

    const hasActiveFilters =
        (search?.trim?.() ?? "").length > 0 ||
        localDestinationsSelected.length > 0 ||
        countriesSelected.length > 0 ||
        categoriesSelected.length > 0 ||
        minPrice !== "" ||
        maxPrice !== "" ||
        durationRange !== "all" ||
        priceRange !== "all";

    // Applied filters (from URL/defaults) — used for summary only after apply
    const appliedLocal = defaultValues?.localDestination ? defaultValues.localDestination.split(",").filter(Boolean) : [];
    const appliedCountries = defaultValues?.country ? defaultValues.country.split(",").filter(Boolean) : [];
    const appliedCategories = defaultValues?.category ? defaultValues.category.split(",").filter(Boolean) : [];
    const appliedSearch = defaultValues?.search?.trim?.() ?? "";
    const appliedPrice =
        (defaultValues?.minPrice ?? "") !== "" ||
        (defaultValues?.maxPrice ?? "") !== "" ||
        (defaultValues?.priceRange ?? "all") !== "all";
    const appliedDuration = (defaultValues?.durationRange ?? "all") !== "all";

    const appliedFilterCount =
        (appliedSearch ? 1 : 0) +
        (appliedLocal.length > 0 ? 1 : 0) +
        (appliedCountries.length > 0 ? 1 : 0) +
        (appliedCategories.length > 0 ? 1 : 0) +
        (appliedPrice ? 1 : 0) +
        (appliedDuration ? 1 : 0);

    const pillBase =
        "h-10 rounded-full border text-sm font-medium transition whitespace-nowrap px-3 inline-flex items-center gap-2";
    const pillActive = "border-slate-900 bg-slate-900 text-white";
    const pillInactive = "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
    const pillDisabled = "opacity-70 cursor-not-allowed";

    const openDialog = () => {
        setIsDialogOpen(true);
    };

    const clearAndClose = () => {
        handleClear();
        setIsDialogOpen(false);
    };

    return (
        <div className="py-1 space-y-2" aria-busy={isPending}>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    {/* Categories left, scrollable */}
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {quickCategoryChips.map(({ label, value, icon: Icon }) => {
                            const isActive = categoriesSelected.includes(value);
                            return (
                                <button
                                    key={`cat-${value}`}
                                    type="button"
                                    onClick={() => handleCategoryChip(value)}
                                    disabled={isPending}
                                    className={`${pillBase} ${isActive ? pillActive : pillInactive} ${isPending ? pillDisabled : ""} shrink-0 snap-start`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filters right */}
                    <div className="flex shrink-0 items-center gap-2">
                        {appliedFilterCount > 0 && (
                            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                {`${appliedFilterCount} filter${appliedFilterCount > 1 ? "s" : ""} applied`}
                            </div>
                        )}
                        <button
                            type="button"
                            className={`${pillBase} ${pillInactive} ${isPending ? pillDisabled : ""}`}
                            onClick={openDialog}
                            disabled={isPending}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Filters</span>
                        </button>
                        {appliedFilterCount > 0 && (
                            <button
                                type="button"
                                className={`${pillBase} ${pillInactive} ${isPending ? pillDisabled : ""}`}
                                onClick={handleClear}
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isPending && (
                <div className="relative z-20">
                    <div className="container mx-auto px-0 sm:px-0">
                        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur p-4">
                            <TourGridSkeleton />
                        </div>
                    </div>
                </div>
            )}

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
                                <p className="text-xs text-slate-500">Pick one or more local hubs.</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleLocalDestinationChange("all")}
                                        className={`${pillBase} ${localDestinationsSelected.length === 0 ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                        disabled={isPending}
                                    >
                                        Any local
                                    </button>
                                    {localDestinations.map((dest) => (
                                        <button
                                            key={dest}
                                            type="button"
                                            onClick={() => handleLocalDestinationChange(dest)}
                                            className={`${pillBase} ${localDestinationsSelected.includes(dest) ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                            disabled={isPending}
                                        >
                                            {dest}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">International</Label>
                                <p className="text-xs text-slate-500">Pick one or more countries.</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCountryChange("all")}
                                        className={`${pillBase} ${countriesSelected.length === 0 ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                        disabled={isPending}
                                    >
                                        Any country
                                    </button>
                                    {internationalCountries.map((ctry) => (
                                        <button
                                            key={ctry}
                                            type="button"
                                            onClick={() => handleCountryChange(ctry)}
                                            className={`${pillBase} ${countriesSelected.includes(ctry) ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                            disabled={isPending}
                                        >
                                            {ctry}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">Categories</Label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoriesSelected([]);
                                        }}
                                        className={`${pillBase} ${categoriesSelected.length === 0 ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                        disabled={isPending}
                                    >
                                        All categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => handleCategoryChip(cat)}
                                            className={`${pillBase} ${categoriesSelected.includes(cat) ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                            disabled={isPending}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">Duration</Label>
                                <p className="text-xs text-slate-500">Choose the trip length you prefer.</p>
                                <div className="flex flex-wrap gap-2">
                                    {durationFilters.map((opt) => {
                                        const active = durationRange === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleDurationChange(opt.value)}
                                                className={`${pillBase} ${active ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                                disabled={isPending}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => handleDurationChange("all")}
                                        className={`${pillBase} ${durationRange === "all" ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                        disabled={isPending}
                                    >
                                        Any length
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-800">Budget presets</Label>
                                <p className="text-xs text-slate-500">Use presets or type a custom range below.</p>
                                <div className="flex flex-wrap gap-2">
                                    {priceFilters.map((opt) => {
                                        const active = priceRange === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handlePriceRangeChange(opt.value)}
                                                className={`${pillBase} ${active ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                                disabled={isPending}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => handlePriceRangeChange("all")}
                                        className={`${pillBase} ${priceRange === "all" ? pillActive : pillInactive} ${isPending ? pillDisabled : ""}`}
                                        disabled={isPending}
                                    >
                                        Any budget
                                    </button>
                                </div>
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
                                    onChange={(e) => {
                                        setMinPrice(e.target.value);
                                        setPriceRange("all");
                                    }}
                                />
                                <span className="text-slate-400">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => {
                                        setMaxPrice(e.target.value);
                                        setPriceRange("all");
                                    }}
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
