// components/operator/tour-image-upload.tsx
"use client";

import { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { uploadTourImage, deleteTourImage } from "@/lib/upload";
import { toast } from "sonner";

interface TourImageUploadProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    operatorProfileId: string;
    tourId?: string;
    maxImages?: number;
}

export function TourImageUpload({
    images,
    onImagesChange,
    operatorProfileId,
    tourId,
    maxImages = 10,
}: TourImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        if (images.length >= maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
        }

        const remainingSlots = maxImages - images.length;
        const filesToUpload = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            toast.error(`Only uploading ${remainingSlots} image${remainingSlots !== 1 ? "s" : ""} (limit reached)`);
        }

        // Upload files sequentially
        for (const file of filesToUpload) {
            // Validate file
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                continue;
            }

            // Create temporary index for loading state
            const tempIndex = images.length;
            setUploadingIndexes((prev) => new Set(prev).add(tempIndex));

            try {
                // Convert File to ArrayBuffer then to base64 for server action
                const arrayBuffer = await file.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');

                // Create a serializable file object
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                };

                const result = await uploadTourImage(fileData, operatorProfileId, tourId);

                if (result.success && result.url) {
                    // Add uploaded image URL
                    onImagesChange([...images, result.url]);
                    toast.success(`${file.name} uploaded`);
                } else {
                    toast.error(result.error || "Upload failed");
                }
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Upload failed");
            } finally {
                setUploadingIndexes((prev) => {
                    const next = new Set(prev);
                    next.delete(tempIndex);
                    return next;
                });
            }
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemove = async (index: number) => {
        const imageUrl = images[index];

        // Optimistically remove from UI
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);

        // Try to delete from Supabase
        try {
            const deleted = await deleteTourImage(imageUrl);
            if (deleted) {
                toast.success("Image removed");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            // Image still removed from form even if Supabase delete fails
        }
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const newImages = [...images];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        onImagesChange(newImages);
    };

    const canUploadMore = images.length < maxImages;

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            {canUploadMore && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                            ? "border-primary bg-primary/5"
                            : "border-gray-300 hover:border-primary/50"
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>

                        <div>
                            <p className="font-medium text-gray-700">
                                Drag & drop images here, or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                JPG, PNG or WebP • Max 5MB per image • Up to {maxImages} images
                            </p>
                        </div>

                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Browse Files
                        </Button>
                    </div>
                </div>
            )}

            {/* Image Grid */}
            {(images.length > 0 || uploadingIndexes.size > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Existing images */}
                    {images.map((imageUrl, index) => (
                        <Card key={imageUrl} className="relative overflow-hidden group">
                            <div className="relative aspect-video">
                                <Image
                                    src={imageUrl}
                                    alt={`Tour image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />

                                {/* Cover badge */}
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded">
                                        Cover
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {index > 0 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleReorder(index, 0)}
                                        >
                                            Make Cover
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => handleRemove(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Uploading placeholders */}
                    {Array.from(uploadingIndexes).map((index) => (
                        <Card key={`uploading-${index}`} className="relative overflow-hidden">
                            <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Uploading...</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {images.length === 0 && uploadingIndexes.size === 0 && !canUploadMore && (
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-600">No images uploaded yet</p>
                    </div>
                </Card>
            )}

            {/* Image counter */}
            {images.length > 0 && (
                <p className="text-sm text-gray-600">
                    {images.length} of {maxImages} images uploaded
                </p>
            )}
        </div>
    );
}