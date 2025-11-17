// components/operator/operator-tour-card.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MapPin, Users, Clock, MoreVertical, Edit, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";
import Image from "next/image";
import { toggleTourActive, deleteTour } from "@/actions/operator/tours";
import { TourFormDialog } from "./tour-form-dialog";
import { toast } from "sonner";

interface OperatorTourCardProps {
    tour: {
        id: string;
        title: string;
        description: string;
        duration: string;
        category: string | null;
        priceFrom: number | null;
        currency: string;
        countries: string[];
        region: string | null;
        destinations: string[];
        images: string[];
        maxCapacity: number | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            quoteRequests: number;
        };
    };
    operatorProfileId: string;
}

export function OperatorTourCard({ tour, operatorProfileId }: OperatorTourCardProps) {
    const router = useRouter();
    const [isToggling, setIsToggling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const defaultImage = "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400&h=300&fit=crop";

    const formatPrice = (priceInCents: number) => {
        const rands = priceInCents / 100;
        return `${tour.currency} ${rands.toLocaleString("en-ZA")}`;
    };

    const handleToggleActive = async () => {
        setIsToggling(true);
        try {
            const result = await toggleTourActive(tour.id);
            if (result.success) {
                toast.success(tour.isActive ? "Tour deactivated" : "Tour activated");
                router.refresh();
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to update tour");
            }
        } catch (error) {
            console.error("Error toggling tour:", error);
            toast.error("Something went wrong");
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteTour(tour.id);
            if (result.success) {
                toast.success("Tour deleted successfully");
                router.refresh();
                setShowDeleteDialog(false);
            } else if (!result.success && "error" in result) {
                toast.error(result.error.message || "Failed to delete tour");
            }
        } catch (error) {
            console.error("Error deleting tour:", error);
            toast.error("Something went wrong");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                {/* Compact Image - 80px height */}
                <div className="relative h-20 bg-gray-200">
                    <Image
                        src={tour.images[0] || defaultImage}
                        alt={tour.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-1.5 right-1.5">
                        <Badge
                            variant={tour.isActive ? "default" : "secondary"}
                            className={`text-xs px-2 py-0.5 ${
                                tour.isActive ? "bg-green-600" : "bg-gray-400"
                            }`}
                        >
                            {tour.isActive ? (
                                <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Live
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Hidden
                                </>
                            )}
                        </Badge>
                    </div>

                    {/* Quote Count Badge */}
                    {tour._count.quoteRequests > 0 && (
                        <div className="absolute top-1.5 left-1.5">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs px-2 py-0.5">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {tour._count.quoteRequests}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Compact Content */}
                <div className="p-3 space-y-2">
                    {/* Title + Category */}
                    <div>
                        {tour.category && (
                            <Badge variant="outline" className="text-xs mb-1">
                                {tour.category}
                            </Badge>
                        )}
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {tour.title}
                        </h3>
                    </div>

                    {/* Compact Info - Single Line */}
                    <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{tour.region || tour.countries[0]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{tour.duration}</span>
                            </div>
                            {tour.maxCapacity && (
                                <>
                                    <span className="text-gray-400">•</span>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>Max {tour.maxCapacity}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Starting Price - Compact */}
                    {tour.priceFrom && (
                        <div className="flex items-baseline justify-between pt-2 border-t">
                            <div>
                                <p className="text-xs text-gray-500">From</p>
                                <p className="text-lg font-bold text-primary">
                                    {formatPrice(tour.priceFrom)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons - Compact */}
                    <div className="flex gap-2 pt-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-xs h-8"
                                >
                                    <MoreVertical className="w-3 h-3 mr-1" />
                                    Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <TourFormDialog mode="edit" tour={tour} operatorProfileId={operatorProfileId}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Tour
                                    </DropdownMenuItem>
                                </TourFormDialog>
                                <DropdownMenuItem onClick={handleToggleActive} disabled={isToggling}>
                                    {tour.isActive ? (
                                        <>
                                            <EyeOff className="w-4 h-4 mr-2" />
                                            Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Activate
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <TourFormDialog mode="edit" tour={tour} operatorProfileId={operatorProfileId}>
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="flex-1 text-xs h-8"
                            >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                            </Button>
                        </TourFormDialog>
                    </div>
                </div>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tour?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{tour.title}&quot;. This action cannot be undone.
                            {tour._count.quoteRequests > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                    Warning: This tour has {tour._count.quoteRequests} quote request
                                    {tour._count.quoteRequests !== 1 ? "s" : ""}. Consider deactivating instead of
                                    deleting.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete Tour"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}