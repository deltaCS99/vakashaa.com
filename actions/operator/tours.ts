// actions/operator/tours.ts
"use server";

import { db } from "@/lib/db";
import { requireApprovedOperator } from "@/lib/operator";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { deleteTourImages } from "@/lib/upload";

interface CreateTourParams {
  title: string;
  description: string;
  duration: string;
  category?: string;
  priceFrom?: number; // In cents
  currency?: string;
  countries: string[];
  region?: string;
  destinations?: string[];
  departureDates?: any; // JSON
  availableMonths?: number[];
  availableDates?: string[];
  pickupLocations?: any; // JSON
  maxCapacity?: number;
  inclusions?: string[];
  exclusions?: string[];
  cancellationPolicy?: string;
  images?: string[];
}

interface UpdateTourParams extends CreateTourParams {
  tourId: string;
}

// Get operator's tours
export const getOperatorTours = async () => {
  try {
    const operatorProfile = await requireApprovedOperator();

    const tours = await db.tour.findMany({
      where: {
        operatorProfileId: operatorProfile.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        category: true,
        priceFrom: true,
        currency: true,
        countries: true,
        region: true,
        destinations: true,
        images: true,
        maxCapacity: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            quoteRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return response({
      success: true,
      code: 200,
      data: { tours },
    });
  } catch (error: any) {
    console.error("Error fetching operator tours:", error);
    return response({
      success: false,
      error: {
        code: error.message.includes("pending approval") ? 403 : 500,
        message: error.message || "Failed to fetch tours.",
      },
    });
  }
};

// Get single tour by ID (for editing)
export const getOperatorTourById = async (tourId: string) => {
  try {
    const operatorProfile = await requireApprovedOperator();

    const tour = await db.tour.findFirst({
      where: {
        id: tourId,
        operatorProfileId: operatorProfile.id,
      },
    });

    if (!tour) {
      return response({
        success: false,
        error: {
          code: 404,
          message: "Tour not found.",
        },
      });
    }

    return response({
      success: true,
      code: 200,
      data: { tour },
    });
  } catch (error: any) {
    console.error("Error fetching tour:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to fetch tour details.",
      },
    });
  }
};

// Create new tour
export const createTour = async (params: CreateTourParams) => {
  try {
    const operatorProfile = await requireApprovedOperator();

    // Validate required fields
    if (!params.title || !params.description || !params.duration) {
      return response({
        success: false,
        error: {
          code: 400,
          message: "Title, description, and duration are required.",
        },
      });
    }

    if (!params.countries || params.countries.length === 0) {
      return response({
        success: false,
        error: {
          code: 400,
          message: "At least one country is required.",
        },
      });
    }

    // Create tour
    const tour = await db.tour.create({
      data: {
        operatorProfileId: operatorProfile.id,
        title: params.title,
        description: params.description,
        duration: params.duration,
        category: params.category,
        priceFrom: params.priceFrom,
        currency: params.currency || "ZAR",
        countries: params.countries,
        region: params.region,
        destinations: params.destinations || [],
        departureDates: params.departureDates,
        availableMonths: params.availableMonths || [],
        availableDates: params.availableDates || [],
        pickupLocations: params.pickupLocations,
        maxCapacity: params.maxCapacity,
        inclusions: params.inclusions || [],
        exclusions: params.exclusions || [],
        cancellationPolicy: params.cancellationPolicy,
        images: params.images || [],
        isActive: true,
      },
    });

    revalidatePath("/operator/tours");
    revalidatePath("/");

    return response({
      success: true,
      code: 201,
      data: { tour },
    });
  } catch (error: any) {
    console.error("Error creating tour:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to create tour. Please try again.",
      },
    });
  }
};

// Update tour
export const updateTour = async (params: UpdateTourParams) => {
  try {
    const operatorProfile = await requireApprovedOperator();

    // Verify tour belongs to operator
    const existingTour = await db.tour.findFirst({
      where: {
        id: params.tourId,
        operatorProfileId: operatorProfile.id,
      },
    });

    if (!existingTour) {
      return response({
        success: false,
        error: {
          code: 404,
          message: "Tour not found.",
        },
      });
    }

    // Validate required fields
    if (!params.title || !params.description || !params.duration) {
      return response({
        success: false,
        error: {
          code: 400,
          message: "Title, description, and duration are required.",
        },
      });
    }

    if (!params.countries || params.countries.length === 0) {
      return response({
        success: false,
        error: {
          code: 400,
          message: "At least one country is required.",
        },
      });
    }

    // Update tour
    const tour = await db.tour.update({
      where: { id: params.tourId },
      data: {
        title: params.title,
        description: params.description,
        duration: params.duration,
        category: params.category,
        priceFrom: params.priceFrom,
        currency: params.currency || "ZAR",
        countries: params.countries,
        region: params.region,
        destinations: params.destinations || [],
        departureDates: params.departureDates,
        availableMonths: params.availableMonths || [],
        availableDates: params.availableDates || [],
        pickupLocations: params.pickupLocations,
        maxCapacity: params.maxCapacity,
        inclusions: params.inclusions || [],
        exclusions: params.exclusions || [],
        cancellationPolicy: params.cancellationPolicy,
        images: params.images || [],
      },
    });

    revalidatePath("/operator/tours");
    revalidatePath(`/tours/${params.tourId}`);
    revalidatePath("/");

    return response({
      success: true,
      code: 200,
      data: { tour },
    });
  } catch (error: any) {
    console.error("Error updating tour:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to update tour. Please try again.",
      },
    });
  }
};

// Toggle tour active status
export const toggleTourActive = async (tourId: string) => {
  try {
    const operatorProfile = await requireApprovedOperator();

    // Verify tour belongs to operator
    const existingTour = await db.tour.findFirst({
      where: {
        id: tourId,
        operatorProfileId: operatorProfile.id,
      },
    });

    if (!existingTour) {
      return response({
        success: false,
        error: {
          code: 404,
          message: "Tour not found.",
        },
      });
    }

    // Toggle isActive
    const tour = await db.tour.update({
      where: { id: tourId },
      data: {
        isActive: !existingTour.isActive,
      },
    });

    revalidatePath("/operator/tours");
    revalidatePath("/");

    return response({
      success: true,
      code: 200,
      data: { tour },
    });
  } catch (error: any) {
    console.error("Error toggling tour status:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to update tour status.",
      },
    });
  }
};

// Delete tour
export const deleteTour = async (tourId: string) => {
  try {
    const operatorProfile = await requireApprovedOperator();

    // Verify tour belongs to operator
    const existingTour = await db.tour.findFirst({
      where: {
        id: tourId,
        operatorProfileId: operatorProfile.id,
      },
      include: {
        _count: {
          select: {
            quoteRequests: true,
          },
        },
      },
    });

    if (!existingTour) {
      return response({
        success: false,
        error: {
          code: 404,
          message: "Tour not found.",
        },
      });
    }

    // Prevent deletion if there are active quotes
    if (existingTour._count.quoteRequests > 0) {
      return response({
        success: false,
        error: {
          code: 400,
          message:
            "Cannot delete tour with existing quote requests. Please deactivate it instead.",
        },
      });
    }

    // Delete associated images from Supabase
    if (existingTour.images && existingTour.images.length > 0) {
      await deleteTourImages(existingTour.images);
    }

    // Delete tour
    await db.tour.delete({
      where: { id: tourId },
    });

    revalidatePath("/operator/tours");
    revalidatePath("/");

    return response({
      success: true,
      code: 200,
      data: { message: "Tour deleted successfully." },
    });
  } catch (error: any) {
    console.error("Error deleting tour:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to delete tour. Please try again.",
      },
    });
  }
};