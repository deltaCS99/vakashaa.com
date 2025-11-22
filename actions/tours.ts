// actions/tours.ts
"use server";

import { db } from "@/lib/db";
import { response } from "@/lib/utils";
import { type ScopeValue } from "@/lib/scope";
import { Prisma } from "@prisma/client";

interface GetToursParams {
    localDestinations?: string[]; // Filter by SA regions/cities
    countries?: string[]; // Filter by international country
    scope?: "local" | "international"; // High-level scope filter
    categories?: string[];
    minPrice?: number; // In cents
    maxPrice?: number; // In cents
    minDuration?: number;
    maxDuration?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export const getTours = async (params: GetToursParams = {}) => {
    try {
        const {
            localDestinations = [],
            countries = [],
            scope,
            categories = [],
            minPrice,
            maxPrice,
            minDuration,
            maxDuration,
            search,
            page = 1,
            limit = 12,
        } = params;

        // Build where clause
        const where: Prisma.TourWhereInput = {
            isActive: true,
            operatorProfile: {
                isApproved: true,
                bankVerificationStatus: "Approved",
            },
        };

        // Filter by destinations/countries (OR across chosen sets)
        if (localDestinations.length > 0 || countries.length > 0) {
            const orConditions: Prisma.TourWhereInput[] = [];

            if (localDestinations.length > 0) {
                // ✅ Fix: Properly type the OR conditions
                const localConds: Prisma.TourWhereInput[] = localDestinations.map((dest) => ({
                    countries: { equals: ["South Africa"] },
                    OR: [
                        {
                            region: {
                                contains: dest,
                                mode: Prisma.QueryMode.insensitive // Use Prisma.QueryMode enum
                            }
                        },
                        { destinations: { has: dest } },
                    ],
                }));
                orConditions.push(...localConds); // Spread instead of nesting in OR
            }

            if (countries.length > 0) {
                orConditions.push({ countries: { hasSome: countries } });
            }

            if (orConditions.length > 0) {
                where.AND = where.AND || [];
                (where.AND as Prisma.TourWhereInput[]).push({ OR: orConditions });
            }
        }

        // High-level scope filter
        if (scope === "local") {
            where.AND = where.AND || [];
            (where.AND as Prisma.TourWhereInput[]).push({
                countries: { equals: ["South Africa"] },
            });
        }

        if (scope === "international") {
            where.AND = where.AND || [];
            (where.AND as Prisma.TourWhereInput[]).push({
                NOT: {
                    countries: { equals: ["South Africa"] },
                },
            });
        }

        // Filter by categories
        if (categories.length > 0) {
            where.category = { in: categories };
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

        // Filter by duration
        if (minDuration || maxDuration) {
            /*             where.AND = where.AND || [];
            
                        if (minDuration) {
                            (where.AND as Prisma.TourWhereInput[]).push({
                                duration: { gte: minDuration }
                            });
                        }
            
                        if (maxDuration) {
                            (where.AND as Prisma.TourWhereInput[]).push({
                                duration: { lte: maxDuration }
                            });
                        } */
        }

        // Search across multiple fields
        if (search) {
            where.OR = [
                { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { region: { contains: search, mode: Prisma.QueryMode.insensitive } },
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
                destinations: true,
                inclusions: true,
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
                    isApproved: true,
                    bankVerificationStatus: "Approved",
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
                    bankVerificationStatus: "Approved",
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
                    bankVerificationStatus: "Approved",
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
                    bankVerificationStatus: "Approved",
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
                    bankVerificationStatus: "Approved",
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

export const getCategories = async (scope?: ScopeValue) => {
    try {
        const scopeFilter: Prisma.TourWhereInput | undefined =
            scope === "local"
                ? { countries: { equals: ["South Africa"] } }
                : scope === "international"
                    ? { NOT: { countries: { equals: ["South Africa"] } } }
                    : undefined;

        const categories = await db.tour.findMany({
            where: {
                isActive: true,
                operatorProfile: {
                    isApproved: true,
                    bankVerificationStatus: "Approved",
                },
                category: { not: null },
                ...(scopeFilter ? { AND: [scopeFilter] } : {}),
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