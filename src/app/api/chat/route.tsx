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
            
            // Adjust processing based on findRelevantContent's return type { name: string, similarity: number, source: string, boostedSimilarity: number }[]
            if (similarDocs.length > 0) {
                // similarDocs is already re-ranked by findRelevantContent based on boostedSimilarity
                console.log(`[RAG DEBUG] Received ${similarDocs.length} re-ranked document(s) from findRelevantContent (Top 10 shown):`, JSON.stringify(similarDocs.slice(0, 10), null, 2));
                
                // 1. Filter out the exact current user query from the re-ranked list
                let initialCandidates = similarDocs.filter(doc => doc.name !== userMessage.content);

                // 2. Take top N (e.g., 5) directly from the already re-ranked list
                // Note: initialCandidates is already sorted by boostedSimilarity from findRelevantContent
                const topNCandidates = initialCandidates.slice(0, 5); 
                console.log(`[RAG DEBUG] Top ${topNCandidates.length} candidates after initial filter & slicing:`, JSON.stringify(topNCandidates, null, 2));

                // 3. Filter out known "denial" statements from the assistant
                const assistantDenialPatterns = [
                    "i don't have information about",
                    "i don't know your name",
                    "i'm sorry, but i don't have information",
                    "based on the context, i don't have information",
                    "i don't remember who you are"
                ];
                
                let filteredCandidates = topNCandidates.filter(doc => {
                    if (doc.source === 'assistant') {
                        const lowerDocName = doc.name.toLowerCase();
                        for (const pattern of assistantDenialPatterns) {
                            if (lowerDocName.includes(pattern)) {
                                console.log(`[RAG Filter] Filtering out assistant denial: "${doc.name}"`);
                                return false; // Filter out this doc
                            }
                        }
                    }
                    return true; // Keep doc
                });

                // 4. Final filtering based on user query type (as before), now using filteredCandidates
                let finalContextPool = filteredCandidates.map(doc => doc.name); // Get the text content

                const userQueryIsQuestion = userMessage.content.trim().endsWith('?');
                if (userQueryIsQuestion) {
                    console.log("[RAG] User query is a question. Attempting to filter questions from top N context pool.");
                    finalContextPool = finalContextPool.filter(text => !text.trim().endsWith('?'));
                }
                
                // 5. Deduplicate and join
                const dedupedContextArray = Array.from(new Set(finalContextPool));
                
                if (dedupedContextArray.length > 0) {
                    contextText = dedupedContextArray.join('\n---\n'); 
                    console.log(`[RAG] Constructed context text (length: ${contextText.length}) from ${dedupedContextArray.length} unique relevant result(s): \"${contextText.substring(0, 200)}...\"`);
                } else {
                    console.log("[RAG] No relevant context to use after all filtering."); // Changed log message slightly
                    contextText = '';
                }
            } else {
                console.log('[RAG] No relevant context found in PostgreSQL.');
            }
        } catch (err) {
             console.error('[RAG] Error during similarity search:', err);
        }
        

        // Ingest user message chunks
        console.log(`[API Chat] Upserting user message chunks to DB. Content: \"${String(userMessage.content).substring(0, 100)}...\"`);
        // Call the chunk-based upsert function
        upsertUserDocumentChunks(String(userMessage.content))
            .then(() => console.log('[API Chat] User document chunk upsert process initiated.'))
            .catch(err => console.error('[API Chat] Error initiating user document chunk upsert:', err));        
    } else {
        console.warn('[API Chat] No user message found or user message content is empty. Skipping RAG & user message upsert.');
    }

    // Prepare messages for the LLM
    const messagesForLlm = messages.map((msg: CoreMessage, index: number) => {
        // Check if this is the last user message AND we have context
        if (msg.role === 'user' && index === messages.length - 1 && contextText) {

            // --- Determine original user text --- 
            let originalUserContent = '';
            // Check structured content first (common in Vercel AI SDK)
            if (Array.isArray(msg.content)) { 
                 const textPart = msg.content.find(part => part.type === 'text');
                 if (textPart) {
                     originalUserContent = textPart.text;
                 }
            } 
            // Fallback to string content if not structured or no text part found
            if (!originalUserContent && typeof msg.content === 'string') {
                 originalUserContent = msg.content;
            }
            // Log error if content still not found (should not happen with typical messages)
             if (!originalUserContent) {
                 console.error("[RAG] CRITICAL: Could not extract original user content from message:", msg);
                 originalUserContent = ''; // Assign empty string to avoid errors later
             }
            // --- End Determine original user text --- 

            // Construct the new content with RAG context
            const newContentWithContext = `You are a helpful assistant. Based on the CONTEXT from our past conversation, answer the USER QUESTION. 
If the answer is in the CONTEXT, please use it. Do NOT make up an answer. Do NOT mention that you are using the CONTEXT.
**Important:** If the CONTEXT contains conflicting information (e.g., a direct answer AND a statement that the answer is unknown), prioritize the most factual and direct answer, especially if it comes from a user statement. Use your best judgment to determine the correct answer based on the available context.

CONTEXT:
${contextText}

USER QUESTION: ${originalUserContent}`;

            console.log(`[RAG] Prepended context to current user message. New content: \"${newContentWithContext.substring(0, 350)}...\"`);

            // Create a new, clean message object with ONLY role and the new content.
            // This explicitly removes the potentially problematic \'parts\' array.
            const updatedMsg: CoreMessage = {
                role: msg.role,
                content: newContentWithContext,
                // Explicitly DO NOT include fields like \'parts\' from the original msg
                // Tool call info is not expected on a user message being modified here
                // ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
                // ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
            };

            return updatedMsg; // Return the simplified, updated message object
        }
        // Return the original message object if no modification is needed
        return msg;
    });

    // --- DEBUG LOG --- 
    console.log("[API Chat] Messages being sent to streamText:", JSON.stringify(messagesForLlm, null, 2));
    // --- END DEBUG LOG ---

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
                    .then(() => console.log('[API Chat] Assistant document chunk upsert process initiated.'))
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
