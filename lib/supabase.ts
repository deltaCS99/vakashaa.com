// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for tour images
export const TOUR_IMAGES_BUCKET = 'tour-images';

/**
 * Initialize Supabase storage bucket for tour images
 * Run this once to set up the bucket with proper policies
 */
export async function initializeTourImagesBucket() {
  try {
    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === TOUR_IMAGES_BUCKET);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(TOUR_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      console.log('Tour images bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing bucket:', error);
    return false;
  }
}