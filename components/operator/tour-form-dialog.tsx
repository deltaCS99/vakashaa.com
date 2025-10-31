// components/operator/tour-form-dialog.tsx
"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Info } from "lucide-react";
import { createTour, updateTour } from "@/actions/operator/tours";
import { TourImageUpload } from "./tour-image-upload";
import { toast } from "sonner";

interface TourFormDialogProps {
    mode: "create" | "edit";
    tour?: any;
    operatorProfileId?: string;
    children: ReactNode;
}

const TOUR_CATEGORIES = [
    "Adventure",
    "Wildlife",
    "Cultural",
    "Beach & Coast",
    "City Tours",
    "Safari",
    "Wine Tours",
    "Hiking & Trekking",
    "Water Sports",
    "Photography",
    "Luxury",
    "Budget",
    "Family",
    "Romantic",
    "Group Tours",
];

const SOUTH_AFRICAN_REGIONS = [
    "Western Cape",
    "Eastern Cape",
    "Northern Cape",
    "Free State",
    "KwaZulu-Natal",
    "Gauteng",
    "Limpopo",
    "Mpumalanga",
    "North West",
];

const POPULAR_COUNTRIES = [
    "South Africa",
    "Botswana",
    "Namibia",
    "Zimbabwe",
    "Zambia",
    "Mozambique",
    "Lesotho",
    "Eswatini",
    "Tanzania",
    "Kenya",
];

const CURRENCIES = ["ZAR", "USD", "EUR", "GBP"];

export function TourFormDialog({ mode, tour, operatorProfileId, children }: TourFormDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    // Form state - Basic Info
    const [title, setTitle] = useState(tour?.title || "");
    const [description, setDescription] = useState(tour?.description || "");
    const [duration, setDuration] = useState(tour?.duration || "");
    const [category, setCategory] = useState(tour?.category || "");
    const [priceFrom, setPriceFrom] = useState(
        tour?.priceFrom ? (tour.priceFrom / 100).toString() : ""
    );
    const [currency, setCurrency] = useState(tour?.currency || "ZAR");

    // Form state - Locations
    const [countries, setCountries] = useState<string[]>(tour?.countries || []);
    const [customCountry, setCustomCountry] = useState("");
    const [region, setRegion] = useState(tour?.region || "");
    const [destinations, setDestinations] = useState<string[]>(tour?.destinations || []);
    const [newDestination, setNewDestination] = useState("");

    // Form state - Dates & Capacity
    const [maxCapacity, setMaxCapacity] = useState(tour?.maxCapacity?.toString() || "");

    // Form state - Details
    const [inclusions, setInclusions] = useState<string[]>(tour?.inclusions || [""]);
    const [exclusions, setExclusions] = useState<string[]>(tour?.exclusions || [""]);
    const [cancellationPolicy, setCancellationPolicy] = useState(tour?.cancellationPolicy || "");

    // Form state - Images
    const [images, setImages] = useState<string[]>(tour?.images || []);

    // Add country
    const addCountry = (country: string) => {
        if (country && !countries.includes(country)) {
            setCountries([...countries, country]);
        }
    };

    // Remove country
    const removeCountry = (country: string) => {
        setCountries(countries.filter((c) => c !== country));
    };

    // Add destination
    const addDestination = () => {
        if (newDestination.trim() && !destinations.includes(newDestination.trim())) {
            setDestinations([...destinations, newDestination.trim()]);
            setNewDestination("");
        }
    };

    // Remove destination
    const removeDestination = (index: number) => {
        setDestinations(destinations.filter((_, i) => i !== index));
    };

    // Update inclusion
    const updateInclusion = (index: number, value: string) => {
        const updated = [...inclusions];
        updated[index] = value;
        setInclusions(updated);
    };

    // Add inclusion
    const addInclusion = () => {
        setInclusions([...inclusions, ""]);
    };

    // Remove inclusion
    const removeInclusion = (index: number) => {
        if (inclusions.length > 1) {
            setInclusions(inclusions.filter((_, i) => i !== index));
        }
    };

    // Update exclusion
    const updateExclusion = (index: number, value: string) => {
        const updated = [...exclusions];
        updated[index] = value;
        setExclusions(updated);
    };

    // Add exclusion
    const addExclusion = () => {
        setExclusions([...exclusions, ""]);
    };

    // Remove exclusion
    const removeExclusion = (index: number) => {
        if (exclusions.length > 1) {
            setExclusions(exclusions.filter((_, i) => i !== index));
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            toast.error("Tour title is required");
            setActiveTab("basic");
            return;
        }

        if (!description.trim()) {
            toast.error("Tour description is required");
            setActiveTab("basic");
            return;
        }

        if (!duration.trim()) {
            toast.error("Tour duration is required");
            setActiveTab("basic");
            return;
        }

        if (countries.length === 0) {
            toast.error("At least one country is required");
            setActiveTab("locations");
            return;
        }

        setIsSubmitting(true);

        try {
            // Filter out empty inclusions and exclusions
            const validInclusions = inclusions.filter((inc) => inc.trim() !== "");
            const validExclusions = exclusions.filter((exc) => exc.trim() !== "");

            const params = {
                title: title.trim(),
                description: description.trim(),
                duration: duration.trim(),
                category: category || undefined,
                priceFrom: priceFrom ? Math.round(parseFloat(priceFrom) * 100) : undefined,
                currency: currency || "ZAR",
                countries,
                region: region || undefined,
                destinations,
                maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
                inclusions: validInclusions,
                exclusions: validExclusions,
                cancellationPolicy: cancellationPolicy.trim() || undefined,
                images,
            };

            let result;
            if (mode === "create") {
                result = await createTour(params);
            } else {
                result = await updateTour({ ...params, tourId: tour.id });
            }

            if (result.success) {
                toast.success(mode === "create" ? "Tour created successfully!" : "Tour updated successfully!");
                setOpen(false);
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || `Failed to ${mode} tour`);
            }
        } catch (error) {
            console.error(`Error ${mode}ing tour:`, error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create New Tour" : "Edit Tour"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Fill in the details to create a new tour listing"
                            : "Update your tour information"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="locations">Locations</TabsTrigger>
                        <TabsTrigger value="capacity">Capacity</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Basic Info */}
                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Tour Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g., 7-Day Garden Route Adventure"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your tour in detail..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Include highlights, what makes this tour special, and what guests can expect
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">
                                    Duration <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="duration"
                                    placeholder="e.g., 7 Days / 6 Nights"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TOUR_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priceFrom">Starting Price</Label>
                                <div className="relative">
                                    <Input
                                        id="priceFrom"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={priceFrom}
                                        onChange={(e) => setPriceFrom(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Price per person (optional)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((curr) => (
                                            <SelectItem key={curr} value={curr}>
                                                {curr}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Locations */}
                    <TabsContent value="locations" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>
                                Countries <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <Select
                                    value=""
                                    onValueChange={(value) => {
                                        addCountry(value);
                                    }}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select countries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POPULAR_COUNTRIES.filter((c) => !countries.includes(c)).map((country) => (
                                            <SelectItem key={country} value={country}>
                                                {country}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add custom country */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Or add custom country"
                                    value={customCountry}
                                    onChange={(e) => setCustomCountry(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (customCountry.trim()) {
                                                addCountry(customCountry.trim());
                                                setCustomCountry("");
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (customCountry.trim()) {
                                            addCountry(customCountry.trim());
                                            setCustomCountry("");
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>

                            {/* Selected countries */}
                            {countries.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {countries.map((country) => (
                                        <div
                                            key={country}
                                            className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                                        >
                                            {country}
                                            <button
                                                type="button"
                                                onClick={() => removeCountry(country)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="region">Region (South Africa only)</Label>
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select SA region (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOUTH_AFRICAN_REGIONS.map((reg) => (
                                        <SelectItem key={reg} value={reg}>
                                            {reg}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Only applicable for South African tours</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destinations">Destinations/Cities</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="destinations"
                                    placeholder="e.g., Cape Town, Stellenbosch"
                                    value={newDestination}
                                    onChange={(e) => setNewDestination(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addDestination();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={addDestination}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Destinations list */}
                            {destinations.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {destinations.map((dest, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-50 px-3 py-2 rounded">{dest}</div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeDestination(index)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500">Press Enter or click + to add destination</p>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Capacity */}
                    <TabsContent value="capacity" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                            <Input
                                id="maxCapacity"
                                type="number"
                                min="1"
                                placeholder="e.g., 12"
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Maximum number of guests per tour</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Future Enhancement</p>
                                <p>
                                    Departure dates, available months, and pickup locations will be added in a future
                                    update. For now, customers will request quotes with their preferred dates.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 4: Details */}
                    <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>What&apos;s Included</Label>
                            <div className="space-y-2">
                                {inclusions.map((inclusion, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder="e.g., Accommodation, Meals, Park Fees"
                                            value={inclusion}
                                            onChange={(e) => updateInclusion(index, e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeInclusion(index)}
                                            disabled={inclusions.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Inclusion
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>What&apos;s Not Included</Label>
                            <div className="space-y-2">
                                {exclusions.map((exclusion, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder="e.g., Flights, Travel Insurance, Personal Expenses"
                                            value={exclusion}
                                            onChange={(e) => updateExclusion(index, e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeExclusion(index)}
                                            disabled={exclusions.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addExclusion}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Exclusion
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                            <Textarea
                                id="cancellationPolicy"
                                placeholder="Enter your cancellation and refund policy..."
                                value={cancellationPolicy}
                                onChange={(e) => setCancellationPolicy(e.target.value)}
                                rows={6}
                            />
                            <p className="text-xs text-gray-500">
                                Be clear about cancellation deadlines and refund terms
                            </p>
                        </div>
                    </TabsContent>

                    {/* Tab 5: Images */}
                    <TabsContent value="images" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Tour Images</Label>
                            <TourImageUpload
                                images={images}
                                onImagesChange={setImages}
                                operatorProfileId={operatorProfileId || ""}
                                tourId={tour?.id}
                            />
                            <p className="text-xs text-gray-500">
                                Upload high-quality images of your tour. First image will be the cover photo.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {mode === "create" ? "Creating..." : "Updating..."}
                            </>
                        ) : (
                            <>{mode === "create" ? "Create Tour" : "Update Tour"}</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}