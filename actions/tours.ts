// actions/tours.ts
"use server";

import { db } from "@/lib/db";
import { response } from "@/lib/utils";
import { Prisma } from "@prisma/client";

interface GetToursParams {
    localDestination?: string; // Filter by SA regions/cities
    country?: string; // Filter by international country
    category?: string;
    minPrice?: number; // In cents
    maxPrice?: number; // In cents
    search?: string;
    page?: number;
    limit?: number;
}

export const getTours = async (params: GetToursParams = {}) => {
    try {
        const {
            localDestination,
            country,
            category,
            minPrice,
            maxPrice,
            search,
            page = 1,
            limit = 12,
        } = params;

        // Build where clause
        const where: Prisma.TourWhereInput = {
            isActive: true,
            operatorProfile: {
                isApproved: true,
            },
        };

        // Filter by local destination (South Africa only)
        if (localDestination) {
            where.AND = where.AND || [];
            (where.AND as Prisma.TourWhereInput[]).push({
                countries: { equals: ["South Africa"] }, // Only tours with SA as sole country
                OR: [
                    { region: { contains: localDestination, mode: "insensitive" } },
                    { destinations: { has: localDestination } },
                ]
            });
        }

        // Filter by international country
        if (country) {
            where.countries = { has: country };
        }

        // Filter by category
        if (category) {
            where.category = category;
        }

        // Filter by price (priceFrom in cents)
        if (minPrice || maxPrice) {
            where.AND = where.AND || [];

            if (minPrice) {
                (where.AND as Prisma.TourWhereInput[]).push({
                    priceFrom: { gte: minPrice }
                });
            }

            if (maxPrice) {
                (where.AND as Prisma.TourWhereInput[]).push({
                    priceFrom: { lte: maxPrice }
                });
            }
        }

        // Search across multiple fields
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { region: { contains: search, mode: "insensitive" } },
                { countries: { has: search } },
                { destinations: { has: search } },
            ];
        }

        // Get total count for pagination
        const totalCount = await db.tour.count({ where });
        const totalPages = Math.ceil(totalCount / limit);

        // Get tours with pagination
        const tours = await db.tour.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                priceFrom: true,
                currency: true,
                countries: true,
                region: true,
                category: true,
                images: true,
                maxCapacity: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return response({
            success: true,
            code: 200,
            data: {
                tours,
                totalCount,
                totalPages,
                currentPage: page,
            },
        });
    } catch (error) {
        console.error("Error fetching tours:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch tours. Please try again later.",
            },
        });
    }
};

export const getTourById = async (id: string) => {
    try {
        const tour = await db.tour.findFirst({
            where: {
                id,
                isActive: true,
                operatorProfile: {
                    isApproved: true, // Only show tours from approved operators
                },
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
                departureDates: true,
                availableMonths: true,
                availableDates: true,
                pickupLocations: true,
                maxCapacity: true,
                inclusions: true,
                exclusions: true,
                cancellationPolicy: true,
                images: true,
                createdAt: true,
                updatedAt: true,
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
    } catch (error) {
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

// Get local South African destinations (regions and cities within SA)
export const getLocalDestinations = async () => {
    try {
        const tours = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
                countries: {
                    equals: ["South Africa"] // Only tours with SA as the sole country
                }
            },
            select: {
                region: true,
                destinations: true,
            },
        });

        // Extract unique SA destinations
        const destinationSet = new Set<string>();

        tours.forEach((tour) => {
            // Add region if exists
            if (tour.region) destinationSet.add(tour.region);

            // Add all destinations
            tour.destinations.forEach((dest) => destinationSet.add(dest));
        });

        const destinations = Array.from(destinationSet).sort();

        return response({
            success: true,
            code: 200,
            data: { destinations },
        });
    } catch (error) {
        console.error("Error fetching local destinations:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch local destinations.",
            },
        });
    }
};

// Get international countries (excluding South Africa-only tours)
export const getInternationalCountries = async () => {
    try {
        const tours = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
                NOT: {
                    countries: { equals: ["South Africa"] } // Exclude SA-only tours
                }
            },
            select: {
                countries: true,
            },
        });

        // Extract unique countries excluding South Africa
        const countrySet = new Set<string>();
        tours.forEach((tour) => {
            tour.countries.forEach((country) => {
                if (country !== "South Africa") {
                    countrySet.add(country);
                }
            });
        });

        const countries = Array.from(countrySet).sort();

        return response({
            success: true,
            code: 200,
            data: { countries },
        });
    } catch (error) {
        console.error("Error fetching international countries:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch international countries.",
            },
        });
    }
};

// Get all destinations (backward compatibility)
export const getDestinations = async () => {
    try {
        const tours = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
            },
            select: {
                countries: true,
                region: true,
                destinations: true,
            },
        });

        // Extract unique destinations
        const destinationSet = new Set<string>();

        tours.forEach((tour) => {
            // Add countries
            tour.countries.forEach((country) => destinationSet.add(country));

            // Add region if exists
            if (tour.region) destinationSet.add(tour.region);

            // Add all destinations
            tour.destinations.forEach((dest) => destinationSet.add(dest));
        });

        const destinations = Array.from(destinationSet).sort();

        return response({
            success: true,
            code: 200,
            data: { destinations },
        });
    } catch (error) {
        console.error("Error fetching destinations:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch destinations.",
            },
        });
    }
};

export const getCountries = async () => {
    try {
        const tours = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
            },
            select: {
                countries: true,
            },
        });

        // Extract unique countries
        const countrySet = new Set<string>();
        tours.forEach((tour) => {
            tour.countries.forEach((country) => countrySet.add(country));
        });

        const countries = Array.from(countrySet).sort();

        return response({
            success: true,
            code: 200,
            data: { countries },
        });
    } catch (error) {
        console.error("Error fetching countries:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch countries.",
            },
        });
    }
};

export const getCategories = async () => {
    try {
        const categories = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                },
                category: { not: null },
            },
            select: {
                category: true,
            },
            distinct: ["category"],
        });

        const uniqueCategories = categories
            .map((c) => c.category)
            .filter(Boolean) as string[];

        return response({
            success: true,
            code: 200,
            data: { categories: uniqueCategories.sort() },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return response({
            success: false,
            error: {
                code: 500,
                message: "Failed to fetch categories.",
            },
        });
    }
};