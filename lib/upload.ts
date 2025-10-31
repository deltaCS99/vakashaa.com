// lib/upload.ts
"use server";

import { supabase, TOUR_IMAGES_BUCKET } from './supabase';
import { randomUUID } from 'crypto';

interface UploadImageResult {
    success: boolean;
    url?: string;
    error?: string;
}

interface FileData {
    name: string;
    type: string;
    size: number;
    data: string; // base64
}

/**
 * Upload a tour image to Supabase Storage
 * @param fileData - The serializable file data (base64)
 * @param operatorId - The operator's profile ID
 * @param tourId - Optional tour ID (for organizing images)
 * @returns Upload result with public URL
 */
export async function uploadTourImage(
    fileData: FileData,
    operatorId: string,
    tourId?: string
): Promise<UploadImageResult> {
    try {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(fileData.type)) {
            return {
                success: false,
                error: 'Invalid file type. Please upload JPG, PNG, or WebP images.',
            };
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileData.size > maxSize) {
            return {
                success: false,
                error: 'File too large. Maximum size is 5MB.',
            };
        }

        // Generate unique filename
        const fileExt = fileData.name.split('.').pop();
        const fileName = `${randomUUID()}.${fileExt}`;

        // Create file path: operatorId/tourId/filename or operatorId/filename
        const filePath = tourId
            ? `${operatorId}/${tourId}/${fileName}`
            : `${operatorId}/${fileName}`;

        // Convert base64 to Buffer
        const buffer = Buffer.from(fileData.data, 'base64');

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from(TOUR_IMAGES_BUCKET)
            .upload(filePath, buffer, {
                contentType: fileData.type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return {
                success: false,
                error: 'Failed to upload image. Please try again.',
            };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(TOUR_IMAGES_BUCKET)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during upload.',
        };
    }
}

/**
 * Upload a blog image to Supabase Storage
 * @param fileData - The serializable file data (base64)
 * @returns Upload result with public URL
 */
export async function uploadBlogImage(fileData: FileData): Promise<UploadImageResult> {
    try {
        // Target bucket name
        const BLOG_IMAGES_BUCKET = 'blog-images';

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(fileData.type)) {
            return {
                success: false,
                error: 'Invalid file type. Please upload JPG, PNG, or WebP images.',
            };
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileData.size > maxSize) {
            return {
                success: false,
                error: 'File too large. Maximum size is 5MB.',
            };
        }

        // Generate unique filename
        const fileExt = fileData.name.split('.').pop();
        const fileName = `${randomUUID()}.${fileExt}`;

        // Convert base64 to Buffer
        const buffer = Buffer.from(fileData.data, 'base64');

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BLOG_IMAGES_BUCKET)
            .upload(fileName, buffer, {
                contentType: fileData.type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase blog upload error:', error);
            return {
                success: false,
                error: 'Failed to upload blog image. Please try again.',
            };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BLOG_IMAGES_BUCKET)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error('Blog upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during upload.',
        };
    }
}


/**
 * Delete a tour image from Supabase Storage
 * @param imageUrl - The full public URL of the image to delete
 * @returns Success status
 */
export async function deleteTourImage(imageUrl: string): Promise<boolean> {
    try {
        // Extract file path from URL
        // URL format: https://{project}.supabase.co/storage/v1/object/public/tour-images/{path}
        const urlParts = imageUrl.split(`/${TOUR_IMAGES_BUCKET}/`);
        if (urlParts.length !== 2) {
            console.error('Invalid image URL format');
            return false;
        }

        const filePath = urlParts[1];

        // Delete from Supabase
        const { error } = await supabase.storage
            .from(TOUR_IMAGES_BUCKET)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

/**
 * Delete multiple tour images
 * @param imageUrls - Array of image URLs to delete
 * @returns Success status
 */
export async function deleteTourImages(imageUrls: string[]): Promise<boolean> {
    try {
        const filePaths = imageUrls.map(url => {
            const urlParts = url.split(`/${TOUR_IMAGES_BUCKET}/`);
            return urlParts.length === 2 ? urlParts[1] : null;
        }).filter(Boolean) as string[];

        if (filePaths.length === 0) return false;

        const { error } = await supabase.storage
            .from(TOUR_IMAGES_BUCKET)
            .remove(filePaths);

        if (error) {
            console.error('Supabase bulk delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Bulk delete error:', error);
        return false;
    }
}

/**
 * Get the size of an image file from URL
 * @param imageUrl - The image URL
 * @returns File size in bytes
 */
export async function getImageSize(imageUrl: string): Promise<number | null> {
    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : null;
    } catch (error) {
        console.error('Error getting image size:', error);
        return null;
    }
}