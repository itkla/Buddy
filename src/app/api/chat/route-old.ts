import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searchSimilarDocuments, upsertDocument } from '@/lib/lib/db/actions';
import crypto from 'crypto';

// Allow responses up to 30 seconds
export const maxDuration = 30;

const VECTOR_SIZE = 1536; // Defined locally, or import if exported from db/actions.ts
const CONTEXT_SCORE_THRESHOLD = 0.3;

// Detailed error handling
export function errorHandler(error: unknown) {
    if (error == null) {
        return 'unknown error';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return JSON.stringify(error);
}

export async function POST(req: Request) {
    const { messages } = await req.json();

    let userMessage = messages.findLast((m: any) => m.role === 'user');

    let contextText = '';

    if (userMessage && userMessage.content) {
        if (!userMessage.id) {
            userMessage.id = crypto.randomUUID();
            console.warn('[API Chat] User message was missing ID, generated one:', userMessage.id);
        }

        console.log(`[RAG] Attempting to retrieve context for user message ID: ${userMessage.id}, Content: "${String(userMessage.content).substring(0, 100)}..."`);

        const embeddingModel = openai.embedding('text-embedding-3-small');
        const embeddingResponse = await embeddingModel.doEmbed({ values: [String(userMessage.content)] });
        const queryEmbedding = embeddingResponse.embeddings[0]; 

        if (queryEmbedding?.length === VECTOR_SIZE) {
            const similarDocs = await searchSimilarDocuments(queryEmbedding, 3, CONTEXT_SCORE_THRESHOLD);
            
            if (similarDocs.length > 0) {
                console.log(`[RAG] Filtered ${similarDocs.length} relevant point(s) from PostgreSQL (threshold: ${CONTEXT_SCORE_THRESHOLD}):`, JSON.stringify(similarDocs.map(r => ({id: r.id, score: r.score, payload: r.payload})), null, 2));
                contextText = similarDocs.map((doc: any) => doc.payload?.text).filter(Boolean).join('\n---\n');
                console.log(`[RAG] Constructed context text (length: ${contextText.length}) from ${similarDocs.length} relevant result(s): "${contextText.substring(0, 200)}..."`);
            } else {
                console.log(`[RAG] No relevant context found in PostgreSQL above threshold ${CONTEXT_SCORE_THRESHOLD}.`);
            }
        } else {
            console.warn('[RAG] Could not generate valid query embedding. Skipping context retrieval.');
        }

        // Ingest user message (do not await, run in background)
        // upsertDocument handles its own embedding generation
        upsertDocument(userMessage.id, { text: String(userMessage.content), role: 'user' })
            .catch(err => console.error('[API Chat] Error upserting user message to DB:', JSON.stringify(err, null, 2)));
    } else {
        console.warn('[API Chat] No user message found or user message content is empty. Skipping RAG & user message upsert.');
    }

    // Prepare messages for the LLM
    const messagesForLlm = messages.map((msg: any, index: number) => {
        // If this is the last message and it's a user message, and we have context
        if (msg.role === 'user' && index === messages.length - 1 && contextText) {
            const originalUserContent = String(msg.content);
            const newContent = `Context: ${contextText}\n\nQuestion: ${originalUserContent}`;
            console.log(`[RAG] Prepended context to current user message. New content: "${newContent.substring(0, 300)}..."`);
            return { ...msg, content: newContent };
        }
        return msg;
    });

    const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: messagesForLlm, // Use the potentially modified messages
        // tool calling
        tools: {
            // weather tool
            getWeather: tool({
                description: "Get the weather in a location",
                parameters: z.object({
                    location: z.string().describe("The location to get the weather for"),
                }),
                execute: async ({ location }) => ({
                    location,
                    temperature: 72 + Math.floor(Math.random() * 21) - 10, // Random number (62 ~ 92)
                }),
            }),
            recommend_product: tool({
                description: "Recommend a product based on the user's query",
                parameters: z.object({
                    query: z.string().describe("The user's query"),
                }),
                execute: async ({ query }) => ({
                    product: "Product X",
                    description: "This is a description of Product X",
                    price: 19.99,
                }),
            }),
            // openai web search tool
            web_search_preview: openai.tools.webSearchPreview(
                {
                    // web search tool parameters
                    searchContextSize: "medium", // low | medium | high
                    userLocation: {
                        type: "approximate",
                        city: "Tokyo",
                        region: "Tokyo",
                        country: "Japan",
                        timezone: "Asia/Tokyo",
                    },
                }
            ),
        },
        maxSteps: 10,
        // After the LLM generates a response, ingest it into Qdrant
        onFinish: async ({ text }) => {
            if (text) {
                const aiMessageId = crypto.randomUUID(); // Generate a new unique ID for the AI response
                console.log(`[API Chat] Upserting AI response to DB. ID: ${aiMessageId}`);
                
                // upsertDocument handles its own embedding generation
                upsertDocument(aiMessageId, { text: text, role: 'assistant' })
                    .catch(err => console.error('[API Chat] Error upserting AI response to DB:', JSON.stringify(err, null, 2)));
            } else {
                console.warn('[API Chat] Skipping AI response ingestion because AI response text is empty.');
            }
        },
    });
    return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
    });
}
