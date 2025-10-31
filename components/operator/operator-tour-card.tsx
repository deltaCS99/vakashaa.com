// components/operator/operator-tour-card.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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

    const defaultImage =
        "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=600&fit=crop";

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
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                {/* Tour Image */}
                <div className="relative h-48 bg-gray-200">
                    <Image
                        src={tour.images[0] || defaultImage}
                        alt={tour.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                        <Badge variant={tour.isActive ? "default" : "secondary"} className="font-medium">
                            {tour.isActive ? "Active" : "Inactive"}
                        </Badge>
                    </div>

                    {/* Quote Count Badge */}
                    {tour._count.quoteRequests > 0 && (
                        <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {tour._count.quoteRequests}
                            </Badge>
                        </div>
                    )}

                    {/* Actions Menu */}
                    <div className="absolute bottom-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 bg-white/90 backdrop-blur hover:bg-white"
                                >
                                    <MoreVertical className="h-4 w-4" />
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
                    </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                    {/* Category */}
                    {tour.category && (
                        <Badge variant="outline" className="text-xs">
                            {tour.category}
                        </Badge>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">{tour.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">{tour.description}</p>

                    {/* Details */}
                    <div className="space-y-2 text-sm text-gray-600 pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{tour.countries.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{tour.duration}</span>
                        </div>
                        {tour.maxCapacity && (
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>Max {tour.maxCapacity} guests</span>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    {tour.priceFrom && (
                        <div className="pt-3 border-t">
                            <p className="text-xs text-gray-600">Starting from</p>
                            <p className="text-xl font-bold text-primary">{formatPrice(tour.priceFrom)}</p>
                        </div>
                    )}
                </CardContent>
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