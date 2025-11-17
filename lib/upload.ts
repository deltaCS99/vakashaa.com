// lib/upload.ts
"use server";

import { supabase } from './supabase';
import { randomUUID } from 'crypto';

interface UploadResult {
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

// Bucket names
const TOUR_IMAGES_BUCKET = 'tour-images';
const BLOG_IMAGES_BUCKET = 'blog-images';
const VERIFICATION_DOCS_BUCKET = 'verification-documents';
const BANK_DOCS_BUCKET = 'bank-documents';

/**
 * Upload a tour image to Supabase Storage
 */
export async function uploadTourImage(
    fileData: FileData,
    operatorId: string,
    tourId?: string
): Promise<UploadResult> {
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
        const maxSize = 5 * 1024 * 1024;
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
 * Upload verification document (CIPC, ID, Service Agreement)
 * Stored in private bucket for security
 */
export async function uploadVerificationDocument(
    fileData: FileData,
    operatorId: string,
    documentType: 'cipc' | 'id' | 'agreement'
): Promise<UploadResult> {
    try {
        // Validate file type (PDF and images for ID)
        const validTypes = documentType === 'id'
            ? ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            : ['application/pdf'];

        if (!validTypes.includes(fileData.type)) {
            return {
                success: false,
                error: documentType === 'id'
                    ? 'Invalid file type. Please upload PDF or image files.'
                    : 'Invalid file type. Please upload PDF files only.',
            };
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (fileData.size > maxSize) {
            return {
                success: false,
                error: 'File too large. Maximum size is 10MB.',
            };
        }

        // Generate filename with type and timestamp
        const fileExt = fileData.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${documentType}_${timestamp}.${fileExt}`;

        // Create file path: operatorId/documentType/filename
        const filePath = `${operatorId}/${documentType}/${fileName}`;

        // Convert base64 to Buffer
        const buffer = Buffer.from(fileData.data, 'base64');

        // Upload to Supabase (private bucket)
        const { data, error } = await supabase.storage
            .from(VERIFICATION_DOCS_BUCKET)
            .upload(filePath, buffer, {
                contentType: fileData.type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase verification doc upload error:', error);
            return {
                success: false,
                error: 'Failed to upload document. Please try again.',
            };
        }

        // Get public URL (note: for private buckets, you may need signed URLs)
        const { data: { publicUrl } } = supabase.storage
            .from(VERIFICATION_DOCS_BUCKET)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error('Verification document upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during upload.',
        };
    }
}

/**
 * Upload bank verification document (bank statement/letter)
 * Stored in private bucket for security
 */
export async function uploadBankDocument(
    fileData: FileData,
    operatorId: string
): Promise<UploadResult> {
    try {
        // Validate file type (PDF and images)
        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (!validTypes.includes(fileData.type)) {
            return {
                success: false,
                error: 'Invalid file type. Please upload PDF or image files.',
            };
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (fileData.size > maxSize) {
            return {
                success: false,
                error: 'File too large. Maximum size is 10MB.',
            };
        }

        // Generate filename with timestamp
        const fileExt = fileData.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `bank_${timestamp}.${fileExt}`;

        // Create file path: operatorId/bank/filename
        const filePath = `${operatorId}/bank/${fileName}`;

        // Convert base64 to Buffer
        const buffer = Buffer.from(fileData.data, 'base64');

        // Upload to Supabase (private bucket)
        const { data, error } = await supabase.storage
            .from(BANK_DOCS_BUCKET)
            .upload(filePath, buffer, {
                contentType: fileData.type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase bank doc upload error:', error);
            return {
                success: false,
                error: 'Failed to upload document. Please try again.',
            };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BANK_DOCS_BUCKET)
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error('Bank document upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during upload.',
        };
    }
}

/**
 * Upload blog image
 */
export async function uploadBlogImage(fileData: FileData): Promise<UploadResult> {
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
        const maxSize = 5 * 1024 * 1024;
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

        // Upload to Supabase
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
 * Delete a tour image
 */
export async function deleteTourImage(imageUrl: string): Promise<boolean> {
    try {
        const urlParts = imageUrl.split(`/${TOUR_IMAGES_BUCKET}/`);
        if (urlParts.length !== 2) {
            console.error('Invalid image URL format');
            return false;
        }

        const filePath = urlParts[1];

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
 * Helper: Convert File to FileData (for client-side)
 */
export async function fileToFileData(file: File): Promise<FileData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}