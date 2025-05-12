import { streamText, tool, CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { searchSimilarDocuments, upsertDocument } from '@/lib/lib/db/actions';
import crypto from 'crypto';
import { tools } from "@/ai/tools";
// import { render } from 'ai';
// import ProductRecommendationCard, { ProductRecommendation } from '@/components/common/ProductRecommendationCard';

// Allow responses up to 30 seconds
export const maxDuration = 30;

const VECTOR_SIZE = 1536; // Defined locally, or import if exported from db/actions.ts
const CONTEXT_SCORE_THRESHOLD = 0.1;

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
        const chunks = userMessage.content.trim().split('.').filter((chunk: string) => chunk !== '');  // Chunking as per guide
        const embeddingModel = openai.embedding('text-embedding-ada-002');  // Recommended model from guide
        const embeddingResponse = await embeddingModel.doEmbed({ values: chunks });
        const queryEmbedding = embeddingResponse.embeddings[0];  // Use first embedding for query

        if (queryEmbedding?.length === VECTOR_SIZE) {
            const similarDocs = await searchSimilarDocuments(queryEmbedding, 3, CONTEXT_SCORE_THRESHOLD);
            
            if (similarDocs.length > 0) {
                const filteredContextArray = similarDocs.map(doc => doc.payload?.text)
                    .filter(text => text && !text.trim().endsWith('?') && (text.toLowerCase().includes('my name') || text.toLowerCase().includes('my favorite') || text.toLowerCase().includes('my')));
                const dedupedContext = Array.from(new Set(filteredContextArray)).filter(Boolean).join('\n---\n');
                contextText = dedupedContext || similarDocs.map(doc => doc.payload?.text).filter(Boolean).join('\n---\n');
                console.log(`[RAG] Constructed deduped and filtered context text (length: ${contextText.length}) from ${similarDocs.length} relevant result(s): \"${contextText.substring(0, 200)}...\"`);
            } else {
                console.log(`[RAG] No relevant context found in PostgreSQL above threshold ${CONTEXT_SCORE_THRESHOLD}.`);
            }
        } else {
            console.warn('[RAG] Could not generate valid query embedding. Skipping context retrieval.');
        }

        // Ingest user message (await for debugging)
        console.log(`[API Chat] Calling upsertDocument for user message. ID: ${userMessage.id}, Content: "${String(userMessage.content).substring(0, 100)}..."`);
        try {
            await upsertDocument(userMessage.id, { text: String(userMessage.content), role: 'user' });
            console.log(`[API Chat] upsertDocument for user message succeeded. ID: ${userMessage.id}`);
        } catch (err) {
            console.error('[API Chat] Error upserting user message to DB:', err);
        }
    } else {
        console.warn('[API Chat] No user message found or user message content is empty. Skipping RAG & user message upsert.');
    }

    // Prepare messages for the LLM
    const messagesForLlm = messages.map((msg: any, index: number) => {
        if (msg.role === 'user' && index === messages.length - 1 && contextText) {
            const originalUserContent = String(msg.content);
            const newContent = `You are an AI with conversation memory. Strictly scan the following context for user details like name or preferences, and use them in your response: ${contextText}\n\nUser Question: ${originalUserContent}`;
            console.log(`[RAG] Prepended context to current user message. New content: \"${newContent.substring(0, 300)}...\"`);
            return { ...msg, content: newContent };
        }
        return msg;
    });

    const result = streamText({
        model: openai(process.env.MODEL || "gpt-4o-mini"),
        messages: messagesForLlm, // Use the potentially modified messages
        // tool calling
        tools,
        maxSteps: 10,
        // After the LLM generates a response, ingest it into Qdrant
        onFinish: async ({ text }) => {
            if (text) {
                const aiMessageId = crypto.randomUUID(); // Generate a new unique ID for the AI response
                console.log(`[API Chat] Calling upsertDocument for AI response. ID: ${aiMessageId}, Content: "${text.substring(0, 100)}..."`);
                try {
                    await upsertDocument(aiMessageId, { text: text, role: 'assistant' });
                    console.log(`[API Chat] upsertDocument for AI response succeeded. ID: ${aiMessageId}`);
                } catch (err) {
                    console.error('[API Chat] Error upserting AI response to DB:', err);
                }
            } else {
                console.warn('[API Chat] Skipping AI response ingestion because AI response text is empty.');
            }
        },
    });
    return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
    });
}
