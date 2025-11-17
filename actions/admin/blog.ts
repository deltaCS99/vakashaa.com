// actions/admin/blog.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { response } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { BlogStatus } from "@prisma/client";
import { azureOpenAI, DEPLOYMENT_NAME } from "@/lib/azure-openai";
import { searchWeb } from "@/lib/serpapi";
import { scrapeForResearch } from "@/lib/firecrawl";

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

    console.log("\n" + "=".repeat(60));
    console.log(`🚀 STARTING BLOG GENERATION: "${topic}"`);
    console.log("=".repeat(60) + "\n");

    // Step 1: Search with SerpAPI
    console.log("🔍 Step 1: Searching web with SerpAPI...");
    const searchResults = await searchWeb(
      `${topic} South Africa tourism travel ${currentYear}`,
      5
    );
    console.log(`✅ Found ${searchResults.length} search results`);
    console.log('📊 SERP Results:', JSON.stringify(searchResults, null, 2));

    // Step 2: Scrape full content from top URLs using Firecrawl
    console.log("\n🔥 Step 2: Scraping full content with Firecrawl...");
    const urlsToScrape = searchResults.map(r => r.link).slice(0, 3);
    console.log(`📋 URLs to scrape (top 3):`, urlsToScrape);

    const scrapedContent = await scrapeForResearch(urlsToScrape, 3);
    console.log(`✅ Scraped content length: ${scrapedContent.length} chars`);
    console.log('📄 Scraped Content Preview:', scrapedContent.slice(0, 500) + '...\n');

    // Step 3: Find Related Tours
    console.log("🎯 Step 3: Finding related tours in database...");
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
    console.log(`✅ Found ${relatedTours.length} related tours`);
    console.log('🎯 Related Tours:', JSON.stringify(relatedTours, null, 2));

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

    // Step 4: Generate Blog Content with AI
    console.log("\n✍️ Step 4: Generating blog post with AI...");
    console.log(`📝 Target word count: ${wordCount}`);
    console.log(`🎨 Tone: ${tone}`);
    console.log(`👥 Audience: ${targetAudience || "General travelers"}\n`);

    const systemPrompt = `You are an expert travel content writer specializing in Southern African tourism.

WRITING STYLE - SOUND HUMAN, NOT AI:
❌ NEVER use em dashes (—) - use commas, periods, or semicolons
❌ NEVER use phrases: "delve into", "realm of", "landscape of", "tapestry", "unveil", "discover the secrets"
❌ NEVER start sentences with "Imagine" more than once
❌ AVOID overuse of colons (:) in sentences
❌ AVOID starting paragraphs with "Whether you're..." or "From... to..."
❌ AVOID listing three examples separated by commas constantly
❌ NO flowery, overly poetic language - be direct and practical
❌ AVOID excessive adjectives stacked together

✅ DO use short, punchy sentences mixed with longer ones
✅ DO write conversationally but with authority
✅ DO use contractions naturally (you'll, it's, don't)
✅ DO vary sentence structure and length
✅ DO be specific and concrete, not vague and abstract
✅ DO write like a travel journalist, not a marketing copywriter

Base Tone: ${tone}
Always: Warm, inspiring, action-oriented, helpful
Audience: ${targetAudience || "Travelers seeking authentic Southern African experiences"}
Length: ~${wordCount} words
Current Year: ${currentYear}

CONTENT STRUCTURE (Use natural, engaging headings - NO generic placeholders):

Opening Hook (1-2 paragraphs):
<h2>[Engaging H2 - benefit-driven, specific to topic]</h2>
<p>Start with sensory details or a compelling scene. Make it immediate and vivid. No fluff.</p>

Main Content (3-4 paragraphs):
<h2>[Specific H2 about what makes this experience unique]</h2>
<p>Deep dive. Be specific: actual places, real details, concrete information. What will travelers actually see and do?</p>

Practical Information:
<h2>Planning Your [Specific Topic] Trip</h2>
<h3>Best Time to Visit</h3>
<p>Actual months, weather, crowd levels, specific seasons. No vague advice.</p>

<h3>What to Expect & Costs</h3>
<p>Real ZAR prices with ranges. What's included. Actual durations. Be helpful.</p>

<h3>Tips from Local Guides</h3>
<p>Specific insider advice. Details only locals know. Practical and useful.</p>

FAQ (4-5 questions):
<h2>Common Questions</h2>
<h3>[Real, specific question travelers ask]</h3>
<p>Direct, helpful answer.</p>

HEADING RULES:
✅ Make every heading specific to the topic
✅ Use real place names and details
✅ Be benefit-driven
❌ NEVER use generic placeholders like "Introduction" or "[Main Topic]"

GOOD EXAMPLES:
✅ "Why Kruger Should Be Your First Safari"
✅ "Best Months for Wine Tasting in Stellenbosch"
✅ "What a 3-Day Garden Route Trip Actually Costs"

BAD EXAMPLES:
❌ "Introduction to [Topic]"
❌ "Exploring the Wonders"
❌ "Getting Started"

SEO OPTIMIZATION:
- Target Keywords: ${keywords.length > 0 ? keywords.join(", ") : "Southern Africa, tourism, travel"}
- Use keywords naturally - never stuff
- Include specific locations (cities, parks, landmarks)
- H2/H3 structure for readability
- Meta descriptions under 160 chars

PRICING (${currentYear} rates):
- Always in South African Rand (ZAR)
- Budget: R2K-5K
- Mid-range: R5K-15K
- Luxury: R15K+
- Show value, not just price
- Example: "from R4,500 per person for 3 days"

AUTHENTICITY:
- Reference REAL places (actual parks, cities, routes)
- Include SPECIFIC details only locals would know
- Mention actual seasons, conditions, logistics
- Show expertise through specificity
- No generic travel advice

OUTPUT AS JSON:
{
  "title": "Under 60 chars, compelling, location-specific",
  "slug": "lowercase-with-hyphens-seo-friendly",
  "excerpt": "150-160 chars describing the experience",
  "content": "Complete HTML following structure above",
  "metaTitle": "Under 60 chars, includes main keyword",
  "metaDescription": "150-160 chars with clear value proposition",
  "keywords": ["primary keyword", "southern africa", "specific location", "tour type", "secondary keyword"],
  "featuredImageSuggestion": {
    "description": "Specific description of ideal featured image",
    "searchQuery": "Search query for stock photos",
    "altText": "SEO-optimized alt text"
  }
}

CRITICAL RULES:
- Write as a travel expert who lives in Southern Africa
- Be specific, authentic, inspiring
- Provide genuine value through local knowledge
- Keep it real, practical, and human
- No marketing fluff or sales pitches

WRITE LIKE A HUMAN:
Bad (AI): "Whether you're a seasoned traveler or first-time visitor, this destination offers something for everyone."
Good (Human): "First time here? You'll love it. Been before? There's always something new to find."

Bad (AI): "Delve into the realm of wildlife where nature's tapestry unfolds."
Good (Human): "Watch elephants at sunrise. It never gets old."`;

    const userPrompt = `Write a compelling, SEO-optimized blog post about: "${topic}"

RESEARCH DATA (Use this for accuracy and ${currentYear} trends):
${scrapedContent}

${relatedTours.length > 0 ? `\nRELATED TOUR OPTIONS (Reference naturally if relevant):\n${tourContext}\n` : ""}

${keywords.length > 0 ? `TARGET KEYWORDS (integrate naturally): ${keywords.join(", ")}\n` : ""}

YOUR GOALS:
1. Inspire travelers to experience "${topic}" in Southern Africa
2. Provide genuinely helpful, practical information for ${currentYear}
3. Show local expertise through specific details
4. Drive organic traffic through valuable, SEO-optimized content
5. Be helpful first, promotional never

FOCUS ON:
- What makes "${topic}" uniquely Southern African
- Specific details that prove local knowledge
- Practical costs, timing, preparation (accurate for ${currentYear})
- Real insider tips from local perspective
- Honest, helpful advice

Remember: Be inspiring but practical. Authoritative but approachable. Informative but never boring. Write like you're giving advice to a friend planning their trip.`;

    console.log('🤖 Sending to AI...');
    console.log('System Prompt Length:', systemPrompt.length, 'chars');
    console.log('User Prompt Length:', userPrompt.length, 'chars');
    console.log('Research Content Length:', scrapedContent.length, 'chars\n');

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
      console.error("❌ AI returned empty content");
      return response({
        success: false,
        error: { code: 500, message: "Failed to generate content from AI." },
      });
    }

    console.log('✨ AI Response Length:', generatedContent.length, 'chars');
    console.log('📄 Raw AI Response Preview:', generatedContent.slice(0, 300) + '...\n');

    const blogData: GeneratedBlog = JSON.parse(generatedContent);
    blogData.relatedTourIds = relatedTours.map((t) => t.id);

    console.log('📦 Parsed Blog Data:');
    console.log('   - Title:', blogData.title);
    console.log('   - Slug:', blogData.slug);
    console.log('   - Content Length:', blogData.content.length, 'chars');
    console.log('   - Keywords:', blogData.keywords.join(', '));
    console.log('   - Related Tours:', blogData.relatedTourIds.length);

    console.log("\n" + "=".repeat(60));
    console.log("✅ BLOG POST GENERATED SUCCESSFULLY!");
    console.log("=".repeat(60) + "\n");

    return response({
      success: true,
      code: 200,
      data: { blogData },
    });
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ BLOG GENERATION FAILED");
    console.error("=".repeat(60));
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    return response({
      success: false,
      error: {
        code: 500,
        message: "Failed to generate blog post. Please try again.",
      },
    });
  }
};