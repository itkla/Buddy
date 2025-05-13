import { streamText, tool, CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { findRelevantContent, generateEmbedding } from '@/lib/ai/embedding';
import { upsertUserDocumentChunks, upsertAssistantDocumentChunks } from '@/lib/db/actions';
import crypto from 'crypto';
import { tools } from "@/ai/tools";
// import { render } from 'ai';
// import ProductRecommendationCard, { ProductRecommendation } from '@/components/common/ProductRecommendationCard';

// Allow responses up to 30 seconds
export const maxDuration = 30;

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
        // Note: findRelevantContent handles embedding generation internally
        // const chunks = userMessage.content.trim().split('.').filter((chunk: string) => chunk !== '');  // Chunking handled within findRelevantContent if needed
        // const embeddingModel = openai.embedding('text-embedding-ada-002');
        // const embeddingResponse = await embeddingModel.doEmbed({ values: chunks });
        // const queryEmbedding = embeddingResponse.embeddings[0]; 
        
        try {
            console.log(`[RAG] Searching for relevant content for query: \"${userMessage.content.substring(0, 100)}...\"`);
            // Use findRelevantContent which takes the query string directly
            const similarDocs = await findRelevantContent(userMessage.content); 
            
            // Adjust processing based on findRelevantContent's return type { name: string, similarity: number }[]
            if (similarDocs.length > 0) {
                console.log(`[RAG] Found ${similarDocs.length} relevant document(s) from DB:`, JSON.stringify(similarDocs, null, 2));
                
                // --- Refined Context Construction --- 
                // 1. Get the text content from the retrieved documents.
                const rawContextArray = similarDocs
                    .map(doc => doc.name)
                    .filter(Boolean)
                    .filter(text => text !== userMessage.content);
                
                // 2. Deduplicate the context snippets.
                const dedupedContextArray = Array.from(new Set(rawContextArray));
                
                // 3. Join the unique context snippets.
                if (dedupedContextArray.length > 0) {
                    contextText = dedupedContextArray.join('\n---\n'); 
                    console.log(`[RAG] Constructed context text (length: ${contextText.length}) from ${dedupedContextArray.length} unique relevant result(s) (after filtering current query): \"${contextText.substring(0, 200)}...\"`);
                } else {
                    console.log(`[RAG] No relevant context to use after filtering current query.`);
                    contextText = '';
                }
                // --- End Refined Context Construction ---
            } else {
                console.log(`[RAG] No relevant context found in PostgreSQL.`);
            }
        } catch (err) {
             console.error('[RAG] Error during similarity search:', err);
        }
        

        // Ingest user message chunks
        console.log(`[API Chat] Upserting user message chunks to DB. Content: \"${String(userMessage.content).substring(0, 100)}...\"`);
        // Call the chunk-based upsert function
        upsertUserDocumentChunks(String(userMessage.content))
            .then(() => console.log("[API Chat] User document chunk upsert process initiated."))
            .catch(err => console.error('[API Chat] Error initiating user document chunk upsert:', err));        
    } else {
        console.warn('[API Chat] No user message found or user message content is empty. Skipping RAG & user message upsert.');
    }

    // Prepare messages for the LLM
    const messagesForLlm = messages.map((msg: any, index: number) => {
        if (msg.role === 'user' && index === messages.length - 1 && contextText) {
            const originalUserContent = String(msg.content);
            // Strengthened Prompt
            const newContent = `Based *solely* on the CONTEXT provided below, answer the USER QUESTION. 
CONTEXT:
${contextText}

USER QUESTION: ${originalUserContent}`;
            console.log(`[RAG] Prepended context to current user message. New content: \"${newContent.substring(0, 300)}...\"`);
            return { ...msg, content: newContent };
        }
        return msg;
    });

    const result = streamText({
        model: openai(process.env.MODEL || "gpt-4o-mini"),
        messages: messagesForLlm,
        // tool calling
        tools,
        maxSteps: 10,
        // After the LLM generates a response, ingest its chunks
        onFinish: async ({ text }) => {
            if (text && text.trim()) {
                const aiMessageId = crypto.randomUUID();
                // Ingest assistant response chunks
                console.log(`[API Chat] Upserting assistant response chunks to DB. ID: ${aiMessageId}, Content: \"${text.substring(0, 100)}...\"`);
                // Call the chunk-based upsert function
                upsertAssistantDocumentChunks(text) 
                    .then(() => console.log("[API Chat] Assistant document chunk upsert process initiated."))
                    .catch(err => console.error('[API Chat] Error initiating assistant document chunk upsert:', err));
            } else {
                console.warn('[API Chat] Skipping AI response ingestion because AI response text is empty.');
            }
        },
    });
    return result.toDataStreamResponse({
        getErrorMessage: errorHandler,
    });
}
