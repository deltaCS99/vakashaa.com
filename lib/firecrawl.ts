// lib/firecrawl.ts
import Firecrawl from "@mendable/firecrawl-js";

if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set");
}

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    markdown: string;
    success: boolean;
    error?: string;
}

/**
 * Batch scrape multiple URLs using Firecrawl's batch API with real-time updates
 * Following official docs: https://docs.firecrawl.dev
 */
export async function batchScrapeUrls(urls: string[]): Promise<ScrapedContent[]> {
    try {
        console.log(`🔥 Starting batch scrape for ${urls.length} URLs...`);

        // Start batch scrape job - exactly as in docs
        const start = await app.startBatchScrape(urls, {
            options: {
                formats: ['markdown']
            }
        });

        console.log(`📦 Batch job started: ${start.id}`);

        // Try watcher with timeout
        console.log('⏱️ Waiting for watcher (30s timeout)...');

        const watcherPromise = new Promise<ScrapedContent[]>((resolve, reject) => {
            const watch = app.watcher(start.id, {
                kind: 'batch',
                pollInterval: 2
            });

            const scrapedResults: ScrapedContent[] = [];
            let completedCount = 0;

            watch.on('document', (doc: any) => {
                completedCount++;
                console.log(`✅ Scraped ${completedCount}/${urls.length}: ${doc.metadata?.sourceURL || "unknown"}`);

                scrapedResults.push({
                    url: doc.metadata?.sourceURL || "",
                    title: doc.metadata?.title || "",
                    content: doc.markdown || "",
                    markdown: doc.markdown || "",
                    success: true,
                });
            });

            watch.on('error', (err: any) => {
                console.error('❌ Watcher error:', err);
            });

            watch.on('done', (state: any) => {
                console.log(`🎉 Watcher completed: ${state.status}`);
                resolve(scrapedResults);
            });

            watch.start().catch(reject);
        });

        // Add 30 second timeout
        const timeoutPromise = new Promise<ScrapedContent[]>((resolve) => {
            setTimeout(() => {
                console.log('⏱️ Watcher timeout - falling back to status polling');
                resolve([]);
            }, 30000); // 30 seconds
        });

        const watcherResults = await Promise.race([watcherPromise, timeoutPromise]);

        // Use getBatchScrapeStatus as fallback
        if (watcherResults.length === 0) {
            console.log("⚠️ Watcher returned 0 results or timed out, using getBatchScrapeStatus...");

            // Wait a bit for job to complete if it just started
            await new Promise(resolve => setTimeout(resolve, 5000));

            const status = await app.getBatchScrapeStatus(start.id);
            console.log(`📊 Batch status: ${status.status}, total: ${status.total}, completed: ${status.completed}`);

            if (status.data && status.data.length > 0) {
                const fallbackResults = status.data.map((doc: any) => ({
                    url: doc.metadata?.sourceURL || "",
                    title: doc.metadata?.title || "",
                    content: doc.markdown || "",
                    markdown: doc.markdown || "",
                    success: true,
                }));

                console.log(`✅ Retrieved ${fallbackResults.length} documents via fallback`);
                return fallbackResults;
            } else {
                console.log(`⚠️ Job still processing or failed. Status: ${status.status}`);
            }
        }

        return watcherResults;
    } catch (error: any) {
        console.error("❌ Batch scrape failed:", error.message);
        return [];
    }
}

/**
 * Scrape URLs and return combined research context
 */
export async function scrapeForResearch(
    urls: string[],
    maxUrls: number = 3
): Promise<string> {
    const urlsToScrape = urls.slice(0, maxUrls);
    const results = await batchScrapeUrls(urlsToScrape);

    const successfulScrapes = results.filter((r) => r.success);

    if (successfulScrapes.length === 0) {
        return "No content could be scraped from the provided URLs.";
    }

    // Combine all scraped content into research context
    const researchContext = successfulScrapes
        .map((result, index) => {
            const contentPreview = result.content.slice(0, 3000);
            return `[Source ${index + 1}] ${result.title}
URL: ${result.url}

${contentPreview}${result.content.length > 3000 ? "..." : ""}

---`;
        })
        .join("\n\n");

    return researchContext;
}