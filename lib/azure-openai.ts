// lib/azure-openai.ts
import { AzureOpenAI } from "openai";

if (!process.env.AZURE_OPENAI_API_KEY) {
    throw new Error("AZURE_OPENAI_API_KEY is not set");
}

if (!process.env.AZURE_OPENAI_ENDPOINT) {
    throw new Error("AZURE_OPENAI_ENDPOINT is not set");
}

if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
    throw new Error("AZURE_OPENAI_DEPLOYMENT_NAME is not set");
}

export const azureOpenAI = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});

export const DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;