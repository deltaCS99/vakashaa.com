// lib/serpapi.ts
import { getJson } from "serpapi";

if (!process.env.SERPAPI_API_KEY) {
    throw new Error("SERPAPI_API_KEY is not set");
}

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

export async function searchWeb(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
        const response = await getJson({
            engine: "google",
            q: query,
            api_key: process.env.SERPAPI_API_KEY,
            num: limit,
        });

        const organicResults = response.organic_results || [];

        return organicResults.slice(0, limit).map((result: any) => ({
            title: result.title || "",
            link: result.link || "",
            snippet: result.snippet || "",
        }));
    } catch (error) {
        console.error("SerpAPI search error:", error);
        return [];
    }
}