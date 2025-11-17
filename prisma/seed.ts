// prisma/seed.ts
import { PrismaClient, UserRole, QuoteStatus, OperatorType, ServiceType, BlogStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // Check if database is already seeded (IDEMPOTENT CHECK)
    const existingUsers = await prisma.user.count();
    const existingSettings = await prisma.setting.count();

    if (existingUsers > 0 || existingSettings > 0) {
        console.log("✅ Database already seeded. Skipping...");
        console.log(`   Found ${existingUsers} users and ${existingSettings} settings`);
        console.log("   To re-seed, run: npm run prisma:clean");
        return;
    }

    console.log("🆕 Empty database detected. Starting fresh seed...");

    // 1. Seed Settings
    console.log("📋 Creating settings...");

    const settings = [
        { key: "platform_commission_rate", value: "7" },
        { key: "operator_payout_schedule", value: "weekly" },
        { key: "quote_response_hours", value: "24" },
        { key: "cancellation_fee_percentage", value: "10" },
        { key: "min_quote_advance_hours", value: "48" },
        { key: "quote_validity_hours", value: "72" },
        { key: "support_email", value: "support@satours.co.za" },
        { key: "support_phone", value: "+27123456789" },
        { key: "support_whatsapp", value: "+27123456789" },
        { key: "payfast_merchant_id", value: "10000100" },
        { key: "payfast_merchant_key", value: "test_key" },
        { key: "payment_gateway_active", value: "payfast" },
        { key: "max_tour_images", value: "5" },
        { key: "max_tours_per_operator", value: "50" },
        { key: "operator_approval_required", value: "true" },
        { key: "email_provider", value: "resend" },
        { key: "sms_provider", value: "twilio" },
        { key: "send_quote_notifications", value: "true" },
        { key: "allow_child_bookings", value: "true" },
        { key: "require_customer_whatsapp", value: "false" },
        { key: "platform_name", value: "SA Tours" },
        { key: "platform_url", value: "https://satours.co.za" },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }

    // 2. Create Admin User
    console.log("👤 Creating admin user...");
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@satours.co.za" },
        update: {},
        create: {
            email: "admin@satours.co.za",
            name: "Admin User",
            password: adminPassword,
            role: UserRole.Admin,
            emailVerified: new Date(),
        },
    });

    // 3. Create Test Operators
    console.log("👥 Creating operators...");
    const operatorPassword = await bcrypt.hash("Operator123!", 10);

    const operator1 = await prisma.user.create({
        data: {
            email: "john@wildlifetours.co.za",
            name: "John van der Merwe",
            password: operatorPassword,
            role: UserRole.Operator,
            phone: "+27821234567",
            whatsappNumber: "+27821234567",
            emailVerified: new Date(),
            operatorProfile: {
                create: {
                    businessName: "Wildlife Adventures SA",
                    businessPhone: "+27821234567",
                    businessWhatsApp: "+27821234567",
                    description: "Premium wildlife tours across South Africa's best game reserves.",
                    operatorType: OperatorType.TourOperator,
                    serviceType: ServiceType.Domestic,
                    isApproved: true,
                    bankVerificationStatus: "Approved", // ✅ Added
                },
            },
        },
    });

    const operator2 = await prisma.user.create({
        data: {
            email: "sarah@capetownexplorer.co.za",
            name: "Sarah Mitchell",
            password: operatorPassword,
            role: UserRole.Operator,
            phone: "+27834567890",
            whatsappNumber: "+27834567890",
            emailVerified: new Date(),
            operatorProfile: {
                create: {
                    businessName: "Cape Town Explorer Tours",
                    businessPhone: "+27834567890",
                    businessWhatsApp: "+27834567890",
                    description: "Discover the beauty of Cape Town with our expert local guides.",
                    operatorType: OperatorType.TourOperator,
                    serviceType: ServiceType.Inbound,
                    isApproved: true,
                    bankVerificationStatus: "Approved", // ✅ Added
                },
            },
        },
    });

    const operator3 = await prisma.user.create({
        data: {
            email: "kim@leisuretravel.co.za",
            name: "Kim Nguyen",
            password: operatorPassword,
            role: UserRole.Operator,
            phone: "+27845678901",
            whatsappNumber: "+27845678901",
            emailVerified: new Date(),
            operatorProfile: {
                create: {
                    businessName: "KIM Leisure Travel",
                    businessPhone: "+27845678901",
                    businessWhatsApp: "+27845678901",
                    description: "Multi-country package tours across Southern Africa.",
                    operatorType: OperatorType.DMC,
                    serviceType: ServiceType.Outbound,
                    isApproved: true,
                    bankVerificationStatus: "Approved", // ✅ Added
                },
            },
        },
    });

    const operator4 = await prisma.user.create({
        data: {
            email: "thabo@adventuresa.co.za",
            name: "Thabo Mokoena",
            password: operatorPassword,
            role: UserRole.Operator,
            phone: "+27856789012",
            emailVerified: new Date(),
            operatorProfile: {
                create: {
                    businessName: "Adventure SA",
                    businessPhone: "+27856789012",
                    businessWhatsApp: "+27856789012",
                    description: "Extreme sports and adventure tours.",
                    operatorType: OperatorType.TourOperator,
                    serviceType: ServiceType.All,
                    isApproved: false, // Pending approval
                    bankVerificationStatus: "Pending", // ✅ Added
                },
            },
        },
    });

    // 4. Create Tours (ALL quote-based now)
    console.log("🎯 Creating tours...");

    const wildlifeProfile = await prisma.operatorProfile.findFirst({ where: { userId: operator1.id } });
    const capeProfile = await prisma.operatorProfile.findFirst({ where: { userId: operator2.id } });
    const kimProfile = await prisma.operatorProfile.findFirst({ where: { userId: operator3.id } });

    if (wildlifeProfile && capeProfile && kimProfile) {
        // Wildlife Tours
        await prisma.tour.create({
            data: {
                operatorProfileId: wildlifeProfile.id,
                title: "2-Day Kruger National Park Safari",
                description: "Experience the Big 5 in their natural habitat with expert guides. Includes accommodation, meals, and game drives.",
                duration: "2 Days 1 Night",
                category: "Safari",
                priceFrom: 450000, // R4,500 in cents
                currency: "ZAR", // ✅ Added
                countries: ["South Africa"],
                region: "Mpumalanga",
                destinations: ["Kruger National Park", "Skukuza", "Lower Sabie"],
                maxCapacity: 8, // ✅ Renamed from maxCapacity
                isActive: true, // ✅ Added
                inclusions: ["Accommodation", "All meals", "Game drives", "Park fees", "Expert guide"],
                exclusions: ["Flights", "Personal expenses", "Tips"],
                images: [
                    "https://images.unsplash.com/photo-1516426122078-c23e76319801",
                    "https://images.unsplash.com/photo-1535338454770-8be927b5a00b"
                ],
            },
        });

        await prisma.tour.create({
            data: {
                operatorProfileId: wildlifeProfile.id,
                title: "Pilanesberg Day Safari",
                description: "Full day safari in Pilanesberg National Park. See the Big 5 just 2 hours from Johannesburg.",
                duration: "8 Hours",
                category: "Safari",
                priceFrom: 150000, // R1,500 in cents
                currency: "ZAR", // ✅ Added
                countries: ["South Africa"],
                region: "North West",
                destinations: ["Pilanesberg National Park", "Sun City"],
                maxCapacity: 12,
                isActive: true, // ✅ Added
                inclusions: ["Transport", "Park fees", "Lunch", "Guide", "Refreshments"],
                exclusions: ["Tips", "Personal expenses"],
                images: [
                    "https://images.unsplash.com/photo-1535338454770-8be927b5a00b"
                ],
            },
        });

        // Cape Town Tours
        await prisma.tour.create({
            data: {
                operatorProfileId: capeProfile.id,
                title: "Table Mountain & City Tour",
                description: "Explore Cape Town's iconic Table Mountain via cable car and discover the city's rich history.",
                duration: "8 Hours",
                category: "City Tour",
                priceFrom: 120000, // R1,200 in cents
                currency: "ZAR", // ✅ Added
                countries: ["South Africa"],
                region: "Western Cape",
                destinations: ["Table Mountain", "Cape Town CBD", "Bo-Kaap"],
                maxCapacity: 15,
                isActive: true, // ✅ Added
                inclusions: ["Cable car tickets", "Transport", "Guide", "City tour"],
                exclusions: ["Meals", "Tips"],
                images: [
                    "https://images.unsplash.com/photo-1580060839134-75a5edca2e99",
                    "https://images.unsplash.com/photo-1529528070131-eda9f3e90919"
                ],
            },
        });

        await prisma.tour.create({
            data: {
                operatorProfileId: capeProfile.id,
                title: "Cape Peninsula Full Day Tour",
                description: "Visit Cape Point, see the penguins at Boulders Beach, and drive the scenic Chapman's Peak.",
                duration: "9 Hours",
                category: "Scenic Tour",
                priceFrom: 140000, // R1,400 in cents
                currency: "ZAR", // ✅ Added
                countries: ["South Africa"],
                region: "Western Cape",
                destinations: ["Cape Point", "Boulders Beach", "Simon's Town", "Chapman's Peak"],
                maxCapacity: 14,
                isActive: true, // ✅ Added
                inclusions: ["Transport", "Peninsula entrance fees", "Penguin colony entry", "Guide"],
                exclusions: ["Meals", "Cable car at Cape Point", "Tips"],
                images: [
                    "https://images.unsplash.com/photo-1523805009345-7448845a9e53"
                ],
            },
        });

        await prisma.tour.create({
            data: {
                operatorProfileId: capeProfile.id,
                title: "Stellenbosch Wine Tasting Tour",
                description: "Taste award-winning wines in the beautiful Stellenbosch region. Visit 3 premium wine farms.",
                duration: "6 Hours",
                category: "Wine Tour",
                priceFrom: 110000, // R1,100 in cents
                currency: "ZAR", // ✅ Added
                countries: ["South Africa"],
                region: "Western Cape",
                destinations: ["Stellenbosch", "Franschhoek", "Paarl"],
                maxCapacity: 10,
                isActive: true, // ✅ Added
                inclusions: ["Wine tastings", "Cellar tours", "Transport", "Guide", "Cheese platter"],
                exclusions: ["Lunch", "Additional wine purchases"],
                images: [
                    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb"
                ],
            },
        });

        // Multi-Country Package Tour
        await prisma.tour.create({
            data: {
                operatorProfileId: kimProfile.id,
                title: "Triland Tour - Victoria Falls Adventure",
                description: "5 nights exploring Botswana, Zambia & Zimbabwe. Experience Victoria Falls, Chobe National Park, and the Zambezi River. All-inclusive package with accommodation and daily activities.",
                duration: "5 Nights 3 Countries",
                category: "Package Tour",
                priceFrom: 1850000, // R18,500 in cents
                currency: "ZAR", // ✅ Added
                countries: ["Botswana", "Zambia", "Zimbabwe"],
                region: "Victoria Falls Region",
                destinations: ["Kasane", "Victoria Falls", "Chobe National Park", "Livingstone"],
                maxCapacity: 20,
                isActive: true, // ✅ Added
                inclusions: [
                    "2 Nights Zimbabwe with daily breakfast",
                    "3 Nights Zambia with daily breakfast",
                    "Victoria Falls day tour",
                    "Zambezi River sunset cruise including dinner",
                    "Kasane town day tour",
                    "Return shuttle from Kempton Park",
                    "Return flights from OR Tambo Airport"
                ],
                exclusions: ["Lunches", "Additional activities", "Travel insurance", "Personal expenses", "Visa fees"],
                images: [
                    "https://images.unsplash.com/photo-1516426122078-c23e76319801",
                    "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6"
                ],
            },
        });
    }

    // 5. Create Test Customer and Quote Requests
    console.log("📋 Creating test quote requests...");
    const customerPassword = await bcrypt.hash("Customer123!", 10);
    const customer = await prisma.user.create({
        data: {
            email: "customer@example.com",
            name: "Test Customer",
            password: customerPassword,
            role: UserRole.User,
            phone: "+27812345678",
            whatsappNumber: "+27812345678",
            emailVerified: new Date(),
        },
    });

    const krugerTour = await prisma.tour.findFirst({
        where: { title: { contains: "Kruger" } }
    });

    const tableMountainTour = await prisma.tour.findFirst({
        where: { title: { contains: "Table Mountain" } }
    });

    if (krugerTour) {
        // Pending quote request
        await prisma.quoteRequest.create({
            data: {
                reference: "QR-2025001",
                userId: customer.id,
                tourId: krugerTour.id,
                preferredDate: "2025-03-15", // ✅ Changed to Date
                flexibleDates: true,
                adults: 2,
                children: 0,
                childAges: [], // ✅ Added
                budgetRange: "R8,000 - R10,000",
                specialRequirements: "Prefer morning game drives. One person has mobility issues.",
                status: QuoteStatus.Pending,
                customerName: customer.name!,
                customerEmail: customer.email!,
                customerPhone: customer.phone!,
                customerWhatsApp: customer.whatsappNumber,
            },
        });

        // Quoted request
        const quotedRequest = await prisma.quoteRequest.create({
            data: {
                reference: "QR-2025002",
                userId: customer.id,
                tourId: krugerTour.id,
                preferredDate: "2025-03-15",// ✅ Changed to Date
                flexibleDates: false,
                adults: 2,
                children: 1,
                childAges: [8],
                budgetRange: "R10,000 - R15,000",
                specialRequirements: "Child is vegetarian",
                status: QuoteStatus.Quoted,
                quotedPrice: 1200000, // R12,000
                confirmedTourDate: new Date("2025-04-20"), // ✅ Added
                confirmedTourEndDate: new Date("2025-04-22"), // ✅ Added
                quotedInclusions: [
                    { item: "Luxury lodge accommodation (2 nights)", price: null },
                    { item: "All meals with vegetarian options", price: null },
                    { item: "4 game drives", price: null },
                    { item: "Park fees (2 adults, 1 child)", price: null },
                    { item: "Private guide upgrade", price: 200000 }
                ],
                quotedExclusions: [
                    { item: "Flights from Cape Town", price: 450000 },
                    { item: "Travel insurance", price: null },
                    { item: "Tips", price: null }
                ],
                quotedTerms: "50% deposit required to confirm booking. Balance due 14 days before departure. Free cancellation up to 30 days before tour.",
                quoteValidityHours: 72,
                quotedAt: new Date(),
                quoteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
                customerName: customer.name!,
                customerEmail: customer.email!,
                customerPhone: customer.phone!,
                customerWhatsApp: customer.whatsappNumber,
            },
        });

        // Add messages to quoted request
        await prisma.quoteMessage.createMany({
            data: [
                {
                    quoteRequestId: quotedRequest.id,
                    senderId: customer.id,
                    senderType: "customer",
                    message: "Hi, I'd like to know if you can accommodate a vegetarian child on this tour?",
                    readAt: new Date(), // ✅ Added - Already read by operator
                },
                {
                    quoteRequestId: quotedRequest.id,
                    senderId: wildlifeProfile!.userId,
                    senderType: "operator",
                    message: "Absolutely! Our lodge offers excellent vegetarian options. I've included this in your custom quote.",
                    readAt: null, // ✅ Added - Unread by customer
                },
            ],
        });
    }

    if (tableMountainTour) {
        // Paid quote (this is a confirmed booking)
        const paidBooking = await prisma.quoteRequest.create({
            data: {
                reference: "BK-2025001",
                userId: customer.id,
                tourId: tableMountainTour.id,
                preferredDate: "2025-02-28", // ✅ Changed to Date
                flexibleDates: false,
                adults: 2,
                children: 0,
                childAges: [], // ✅ Added
                budgetRange: "R2,000 - R3,000",
                specialRequirements: "Anniversary celebration - any special touches appreciated!",
                status: QuoteStatus.Paid,
                quotedPrice: 240000, // R2,400
                confirmedTourDate: new Date("2025-02-28"), // ✅ Added
                confirmedTourEndDate: new Date("2025-02-28"), // ✅ Added (same day tour)
                quotedInclusions: [
                    { item: "Table Mountain cable car tickets", price: null },
                    { item: "Transport from V&A Waterfront", price: null },
                    { item: "Professional guide", price: null },
                    { item: "City historical tour", price: null },
                    { item: "Anniversary champagne toast", price: null }
                ],
                quotedExclusions: [
                    { item: "Meals", price: null },
                    { item: "Tips", price: null }
                ],
                quotedTerms: "Full payment required. Free cancellation up to 24 hours before tour.",
                quoteValidityHours: 48,
                quotedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                quoteExpiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                paidAmount: 240000,
                paymentReference: "PF-TEST-67890",
                customerName: customer.name!,
                customerEmail: customer.email!,
                customerPhone: customer.phone!,
                customerWhatsApp: customer.whatsappNumber,
            },
        });

        // Add a message to the paid booking
        await prisma.quoteMessage.create({
            data: {
                quoteRequestId: paidBooking.id,
                senderId: capeProfile!.userId,
                senderType: "operator",
                message: "Thank you for booking! We've arranged a special anniversary champagne toast for you at Table Mountain. Looking forward to celebrating with you!",
                readAt: new Date(), // ✅ Read by customer
            },
        });
    }

    // 6. Create Blog Posts
    console.log("📝 Creating blog posts...");
    await prisma.blogPost.createMany({
        data: [
            {
                authorId: admin.id,
                title: "Top 10 Safari Destinations in South Africa",
                slug: "top-10-safari-destinations-south-africa",
                excerpt: "Discover the best places to see wildlife in South Africa, from Kruger to lesser-known gems.",
                content: "South Africa offers some of the world's best safari experiences. From the iconic Kruger National Park to the malaria-free Pilanesberg, here are the top 10 destinations...",
                featuredImage: "https://images.unsplash.com/photo-1516426122078-c23e76319801",
                category: "Destination Guides",
                tags: ["safari", "wildlife", "kruger", "pilanesberg"],
                keywords: ["south africa safari", "best safari destinations", "wildlife tours"],
                metaTitle: "Top 10 Safari Destinations in South Africa | SA Tours",
                metaDescription: "Discover the best safari destinations in South Africa. Expert guide to seeing the Big 5 and more.",
                status: BlogStatus.Published,
                publishedAt: new Date(),
                viewCount: 156,
            },
            {
                authorId: admin.id,
                title: "Cape Town on a Budget: Insider Tips",
                slug: "cape-town-budget-travel-tips",
                excerpt: "Explore Cape Town without breaking the bank with these money-saving tips and free activities.",
                content: "Cape Town doesn't have to be expensive. Here's how to explore the Mother City on a budget with free beaches, hiking trails, and affordable attractions...",
                featuredImage: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99",
                category: "Travel Tips",
                tags: ["cape town", "budget travel", "tips"],
                keywords: ["cape town budget", "cheap cape town", "free activities cape town"],
                metaTitle: "Cape Town Budget Travel Guide | SA Tours",
                metaDescription: "Explore Cape Town without breaking the bank. Free activities, cheap eats, and insider tips.",
                status: BlogStatus.Published,
                publishedAt: new Date(),
                viewCount: 89,
            },
            {
                authorId: admin.id,
                title: "Victoria Falls Travel Guide: Everything You Need to Know",
                slug: "victoria-falls-travel-guide",
                excerpt: "Planning a trip to Victoria Falls? Our complete guide covers the best time to visit, activities, and where to stay.",
                content: "Victoria Falls, one of the Seven Natural Wonders of the World, is a must-visit destination in Southern Africa...",
                featuredImage: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6",
                category: "Destination Guides",
                tags: ["victoria falls", "zimbabwe", "zambia", "waterfalls"],
                keywords: ["victoria falls guide", "when to visit victoria falls", "victoria falls activities"],
                metaTitle: "Victoria Falls Travel Guide 2025 | SA Tours",
                metaDescription: "Complete Victoria Falls travel guide. Best time to visit, top activities, and accommodation tips.",
                status: BlogStatus.Published,
                publishedAt: new Date(),
                viewCount: 234,
            },
        ],
    });

    console.log("✅ Seed completed successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:     admin@satours.co.za / Admin123!");
    console.log("Operator1: john@wildlifetours.co.za / Operator123!");
    console.log("Operator2: sarah@capetownexplorer.co.za / Operator123!");
    console.log("Operator3: kim@leisuretravel.co.za / Operator123!");
    console.log("Operator4: thabo@adventuresa.co.za / Operator123! (Pending Approval)");
    console.log("Customer:  customer@example.com / Customer123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📋 Sample Data Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✓ 6 Tours (all quote-based, active)");
    console.log("✓ 3 Quote Requests (Pending, Quoted with unread message, Paid)");
    console.log("✓ 4 Quote Messages (with read tracking)");
    console.log("✓ 3 Blog Posts");
    console.log("✓ 21 Settings");
    console.log("✓ 4 Operators (3 approved, 1 pending)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });