// actions/admin/blog.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { BlogStatus } from "@prisma/client";
import { azureOpenAI, DEPLOYMENT_NAME } from "@/lib/azure-openai";
import { searchWeb } from "@/lib/serpapi";

// ----------------------
// ADMIN: BLOG CRUD
// ----------------------

// Admin: Create blog post
export const createBlogPost = async (params: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  status?: BlogStatus;
  publishedAt?: Date;
  relatedTourIds?: string[];
}) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return response({
        success: false,
        error: {
          code: 403,
          message: "Unauthorized. Admin access required.",
        },
      });
    }

    // Check if slug already exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug: params.slug },
    });

    if (existingPost) {
      return response({
        success: false,
        error: {
          code: 400,
          message: "A blog post with this slug already exists.",
        },
      });
    }

    const post = await db.blogPost.create({
      data: {
        authorId: user.id!,
        title: params.title,
        slug: params.slug,
        excerpt: params.excerpt,
        content: params.content,
        featuredImage: params.featuredImage,
        metaTitle: params.metaTitle,
        metaDescription: params.metaDescription,
        keywords: params.keywords || [],
        category: params.category,
        tags: params.tags || [],
        status: params.status || BlogStatus.Draft,
        publishedAt: params.publishedAt,
        relatedTours: params.relatedTourIds
          ? {
            connect: params.relatedTourIds.map((id) => ({ id })),
          }
          : undefined,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return response({
      success: true,
      code: 201,
      data: { post },
    });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    return response({
      success: false,
      error: { code: 500, message: "Failed to create blog post." },
    });
  }
};

// Admin: Update blog post
export const updateBlogPost = async (params: {
  postId: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  category?: string;
  tags?: string[];
  status?: BlogStatus;
  publishedAt?: Date;
  relatedTourIds?: string[];
}) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return response({
        success: false,
        error: { code: 403, message: "Unauthorized. Admin access required." },
      });
    }

    const existingPost = await db.blogPost.findUnique({
      where: { id: params.postId },
    });

    if (!existingPost) {
      return response({
        success: false,
        error: { code: 404, message: "Blog post not found." },
      });
    }

    // If slug is changing, check if new slug is available
    if (params.slug && params.slug !== existingPost.slug) {
      const slugTaken = await db.blogPost.findUnique({
        where: { slug: params.slug },
      });
      if (slugTaken) {
        return response({
          success: false,
          error: { code: 400, message: "This slug is already taken." },
        });
      }
    }

    const post = await db.blogPost.update({
      where: { id: params.postId },
      data: {
        title: params.title,
        slug: params.slug,
        excerpt: params.excerpt,
        content: params.content,
        featuredImage: params.featuredImage,
        metaTitle: params.metaTitle,
        metaDescription: params.metaDescription,
        keywords: params.keywords,
        category: params.category,
        tags: params.tags,
        status: params.status,
        publishedAt: params.publishedAt,
        relatedTours: params.relatedTourIds
          ? { set: params.relatedTourIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");

    return response({
      success: true,
      code: 200,
      data: { post },
    });
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    return response({
      success: false,
      error: { code: 500, message: "Failed to update blog post." },
    });
  }
};

// Admin: Delete blog post
export const deleteBlogPost = async (postId: string) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return response({
        success: false,
        error: { code: 403, message: "Unauthorized. Admin access required." },
      });
    }

    const post = await db.blogPost.findUnique({ where: { id: postId } });

    if (!post) {
      return response({
        success: false,
        error: { code: 404, message: "Blog post not found." },
      });
    }

    await db.blogPost.delete({ where: { id: postId } });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return response({
      success: true,
      code: 200,
      data: { message: "Blog post deleted successfully." },
    });
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    return response({
      success: false,
      error: { code: 500, message: "Failed to delete blog post." },
    });
  }
};

// Admin: Toggle publish status
export const toggleBlogPostStatus = async (postId: string) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return response({
        success: false,
        error: { code: 403, message: "Unauthorized. Admin access required." },
      });
    }

    const post = await db.blogPost.findUnique({ where: { id: postId } });

    if (!post) {
      return response({
        success: false,
        error: { code: 404, message: "Blog post not found." },
      });
    }

    const newStatus =
      post.status === BlogStatus.Published
        ? BlogStatus.Draft
        : BlogStatus.Published;

    const updatedPost = await db.blogPost.update({
      where: { id: postId },
      data: {
        status: newStatus,
        publishedAt: newStatus === BlogStatus.Published ? new Date() : null,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");

    return response({
      success: true,
      code: 200,
      data: { post: updatedPost },
    });
  } catch (error: any) {
    console.error("Error toggling blog post status:", error);
    return response({
      success: false,
      error: { code: 500, message: "Failed to toggle blog post status." },
    });
  }
};

// ----------------------
// ADMIN: AI BLOG GENERATION
// ----------------------

interface GenerateBlogParams {
  topic: string;
  keywords?: string[];
  tone: "professional" | "casual" | "luxury" | "adventurous";
  length: "short" | "medium" | "long";
  targetAudience?: string;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  featuredImageSuggestion?: {
    description: string;
    searchQuery: string;
    altText: string;
  };
  relatedTourIds: string[];
}

export const generateBlogPost = async (params: GenerateBlogParams) => {
  try {
    const user = await currentUser();

    if (!user || user.role !== "Admin") {
      return response({
        success: false,
        error: { code: 403, message: "Unauthorized. Admin access required." },
      });
    }

    const { topic, keywords = [], tone, length, targetAudience } = params;

    // Get current year dynamically
    const currentYear = new Date().getFullYear();

    // Step 1: Research
    console.log("🔍 Researching topic:", topic);
    const searchResults = await searchWeb(
      `${topic} South Africa tourism travel ${currentYear}`,
      5
    );

    // Step 2: Related Tours
    console.log("🎯 Finding related tours...");
    const relatedTours = await db.tour.findMany({
      where: {
        OR: [
          { title: { contains: topic, mode: "insensitive" } },
          { description: { contains: topic, mode: "insensitive" } },
          { category: { contains: topic, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: { id: true, title: true, description: true, priceFrom: true },
      take: 3,
    });

    const researchContext = searchResults
      .map((r, i) => `[Source ${i + 1}] ${r.title}: ${r.snippet}`)
      .join("\n\n");

    const tourContext = relatedTours
      .map((t) => {
        const price = t.priceFrom
          ? ` (from R${(t.priceFrom / 100).toLocaleString()})`
          : "";
        return `- ${t.title}${price}: ${t.description.slice(0, 200)}...`;
      })
      .join("\n");

    const wordCount =
      length === "short" ? 500 : length === "medium" ? 1000 : 2000;

    // Step 3: Generate Blog Content
    console.log("✍️ Generating blog post...");

    const systemPrompt = `You are an expert travel content writer for Vakashaa.com - South Africa's premier platform connecting travelers with trusted local tour operators.

BRAND IDENTITY:
- Vakashaa.com: SA platform for authentic Southern African travel experiences
- Mission: Connect travelers with vetted South African tour operators
- Value: Local expertise, authentic experiences, direct bookings
- Region: Southern Africa (SA, Botswana, Namibia, Zimbabwe, Zambia, Mozambique, etc)

WRITING STYLE - AVOID AI TELLS:
❌ NEVER use em dashes (—) - use commas, periods, or semicolons instead
❌ NEVER use phrases like "delve into", "realm of", "landscape of", "tapestry"
❌ NEVER start sentences with "Imagine" more than once
❌ AVOID overuse of colons (:) in sentences
❌ AVOID starting paragraphs with "Whether you're..." or "From... to..."
❌ AVOID listing three examples separated by commas constantly
❌ NO flowery, overly poetic language - be direct and practical

✅ DO use short, punchy sentences mixed with longer ones
✅ DO write like a human travel writer - conversational but authoritative
✅ DO use contractions (you'll, it's, don't) naturally
✅ DO vary sentence structure and length
✅ DO be specific and concrete, not vague and abstract

Base Tone: ${tone}
Always: Warm, inspiring, and action-oriented
Audience: ${targetAudience || "Travelers seeking authentic Southern African experiences"}
Length: ~${wordCount} words
Current Year: ${currentYear}

CONTENT STRUCTURE (Follow this flow but create REAL, engaging headings):

Section 1 - Opening Hook:
<h2>[Create an engaging, benefit-driven H2 about the experience]</h2>
<p>Paint a vivid picture. Make readers feel they're already there. Start with sensory details.</p>

Section 2 - Main Content:
<h2>[Topic-specific H2 highlighting what makes this experience special]</h2>
<p>Deep dive into the experience. Include specific places, details, what travelers will see/do.</p>

Section 3 - Why Book Local:
<h2>Why Book with Local South African Operators</h2>
<p>Explain Vakashaa.com value. Mention safety, expertise, authentic experiences, local connections.</p>

Section 4 - Practical Guide:
<h2>Planning Your [Topic] Adventure</h2>
<h3>Best Time to Visit</h3>
<p>Specific months, weather conditions, crowd levels, seasons...</p>
<h3>What to Expect & Costs</h3>
<p>Realistic ZAR pricing with ranges. What's included, duration, value breakdown...</p>
<h3>Insider Tips from Local Operators</h3>
<p>Specific advice only South African guides would know. Be concrete and useful...</p>

Section 5 - Booking:
<h2>Book Your [Topic] Experience Today</h2>
<p>How Vakashaa.com connects travelers with operators. Natural CTA.</p>

Section 6 - FAQ:
<h2>Frequently Asked Questions</h2>
<h3>[Actual specific question about the topic]</h3>
<p>Helpful answer...</p>
[Create 4-5 real questions travelers would ask]

Final CTA:
<p><strong>Ready to [specific experience]? Browse [topic]-related tours on Vakashaa.com and connect with expert South African operators today.</strong></p>

CRITICAL: Every heading must be REAL and SPECIFIC to the topic. Never use placeholder text like "Captivating Introduction" or "[Main Topic]" - write actual engaging headings!

GOOD HEADING EXAMPLES:
✅ "Why Kruger National Park Should Be Your First Safari"
✅ "Discover Cape Town's Hidden Wine Valleys"
✅ "The Ultimate Guide to Victoria Falls Adventures"

BAD HEADING EXAMPLES:
❌ "Captivating Introduction"
❌ "[Main Topic] - An Unforgettable Experience"
❌ "Local Insights"

Make every heading specific, benefit-driven, and engaging!

BRAND INTEGRATION (Natural, never forced):
- Mention "Vakashaa.com" exactly 2-3 times in context
- Say "South African operators" or "local tour operators" 3-4 times
- Include 2 clear but natural CTAs
- Position Vakashaa as the trusted connection point

SEO OPTIMIZATION:
- Target Keywords: ${keywords.length > 0 ? keywords.join(", ") : "Southern Africa, tourism, travel"}
- Include specific locations (cities, parks, landmarks)
- Use keywords naturally - NEVER stuff
- H2 headings should be benefit-driven and include keywords where natural

COST GUIDELINES (Current year: ${currentYear}):
- Always in South African Rand (ZAR)
- Realistic ${currentYear} prices: Budget (R2K-5K), Mid (R5K-15K), Luxury (R15K+)
- Show value, not just price
- Example: "from R4,500 per person for a 3-day experience"

AUTHENTICITY REQUIREMENTS:
- Reference REAL places (actual parks, cities, routes)
- Include SPECIFIC details only locals would know
- Mention actual seasons, animals, landmarks
- Show expertise through specificity
- Avoid generic travel advice

OUTPUT AS JSON:
{
  "title": "Under 60 chars, compelling, location-specific",
  "slug": "lowercase-with-hyphens-seo-friendly",
  "excerpt": "Exactly 150-160 chars describing experience + mention Vakashaa.com",
  "content": "Complete HTML following structure above",
  "metaTitle": "Under 60 chars, includes location + Vakashaa",
  "metaDescription": "150-160 chars, includes CTA + Vakashaa.com",
  "keywords": ["primary keyword", "southern africa", "specific location", "vakashaa", "tour type", "secondary keyword"],
  "featuredImageSuggestion": {
    "description": "Vivid description of ideal featured image for this blog (e.g., 'Golden sunset over Kruger savanna with elephants silhouetted')",
    "searchQuery": "Unsplash/stock photo search query (e.g., 'kruger sunset elephants')",
    "altText": "SEO-optimized alt text for the image"
  }
}

CRITICAL: Write as an expert who LIVES in Southern Africa. Be specific, be authentic, be inspiring. Drive value through local expertise, not sales pitches.

WRITE LIKE A HUMAN:
Bad (AI): "Whether you're a seasoned traveler or first-time visitor—Kruger offers something for everyone."
Good (Human): "First safari? Kruger's the perfect place to start. Seasoned safari-goer? You'll still find hidden corners that surprise you."

Bad (AI): "Delve into the realm of wildlife where the tapestry of nature unfolds."
Good (Human): "Watch elephants at sunrise. It never gets old."

Keep it real, keep it practical, keep it human.`;

    const userPrompt = `Create an engaging, SEO-optimized blog post about: "${topic}"

CURRENT RESEARCH (Use for accuracy and trends in ${currentYear}):
${researchContext}

${relatedTours.length > 0 ? `\nAVAILABLE TOURS ON VAKASHAA.COM (Reference naturally):\n${tourContext}\n` : ""}

${keywords.length > 0 ? `TARGET KEYWORDS (Use naturally): ${keywords.join(", ")}\n` : ""}

YOUR MISSION:
1. Inspire travelers to experience "${topic}" in Southern Africa
2. Position Vakashaa.com as the trusted platform to book with local experts
3. Provide genuinely helpful, practical information for ${currentYear}
4. Show why South African operators deliver superior experiences
5. Drive organic traffic through valuable, SEO-optimized content

FOCUS ON:
- What makes "${topic}" uniquely Southern African
- Specific details that prove local expertise
- Practical costs, timing, preparation tips (accurate for ${currentYear})
- Why booking with local operators through Vakashaa.com is the smart choice
- Natural CTAs: "Explore ${topic} tours on Vakashaa.com"

Remember: Be inspiring but practical, authoritative but approachable, promotional but genuinely helpful. Make readers excited about Southern Africa AND confident that Vakashaa.com connects them with the best local operators to experience it.`;

    const completion = await azureOpenAI.chat.completions.create({
      model: DEPLOYMENT_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      return response({
        success: false,
        error: { code: 500, message: "Failed to generate content from AI." },
      });
    }

    const blogData: GeneratedBlog = JSON.parse(generatedContent);
    blogData.relatedTourIds = relatedTours.map((t) => t.id);

    console.log("✅ Blog post generated successfully!");

    return response({
      success: true,
      code: 200,
      data: { blogData },
    });
  } catch (error: any) {
    console.error("Error generating blog post:", error);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to generate blog post. Please try again.",
      },
    });
  }
};