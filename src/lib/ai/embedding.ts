import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { user_embeddings, assistant_embeddings } from '../db/schema';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string, minChunkLength = 5, maxQuestionChunkWords = 7): string[] => {
    if (!input) return [];

    const cleanedInput = input.trim().replace(/\s+/g, ' ');
    const potentialChunks = cleanedInput.match(/[^.?!]+[.?!]?/g) || [];

    return potentialChunks
        .map(chunk => chunk.trim())
        .filter(chunk => {
            if (chunk.length < minChunkLength) return false; // Filter short chunks
            // Filter out simple questions
            if (chunk.endsWith('?')) {
                const wordCount = chunk.split(' ').length;
                if (wordCount <= maxQuestionChunkWords) {
                    console.log(`[Chunks] Filtering out question-like chunk: "${chunk}"`);
                    return false; // It's a question and short enough to be considered simple
                }
            }
            return true; // Keep the chunk
        });
};

export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[]; content: string }>> => {
    const chunks = generateChunks(value);
    const { embeddings } = await embedMany({ model: embeddingModel, values: chunks });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
    const input = value.replaceAll('\n', ' ');
    const { embedding } = await embed({ model: embeddingModel, value: input });
    return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
    const userQueryEmbedded = await generateEmbedding(userQuery);
    
    const initialRetrievalLimit = 15; // How many to fetch initially 
    const similarityThreshold = 0.5; 

    console.log(`[Embedding] Searching user_embeddings with limit=${initialRetrievalLimit}, threshold=${similarityThreshold}`);
    const userSimilarity = sql<number>`1 - (${cosineDistance(user_embeddings.embedding, userQueryEmbedded)})`;
    const similarUserDocsPromise = db.select({ 
                                    name: user_embeddings.content, 
                                    similarity: userSimilarity
                                  })
                                  .from(user_embeddings) 
                                  .where(gt(userSimilarity, similarityThreshold))
                                  .orderBy(desc(userSimilarity)) // Order initially by similarity
                                  .limit(initialRetrievalLimit); // Fetch more initially

    console.log(`[Embedding] Searching assistant_embeddings with limit=${initialRetrievalLimit}, threshold=${similarityThreshold}`);
    const assistantSimilarity = sql<number>`1 - (${cosineDistance(assistant_embeddings.embedding, userQueryEmbedded)})`;
    const similarAssistantDocsPromise = db.select({
                                    name: assistant_embeddings.content,
                                    similarity: assistantSimilarity
                                  })
                                  .from(assistant_embeddings)
                                  .where(gt(assistantSimilarity, similarityThreshold))
                                  .orderBy(desc(assistantSimilarity)) // Order initially by similarity
                                  .limit(initialRetrievalLimit); // Fetch more initially
                                  
    const [similarUserDocs, similarAssistantDocs] = await Promise.all([
        similarUserDocsPromise,
        similarAssistantDocsPromise
    ]);

    console.log(`[Embedding] Found ${similarUserDocs.length} initial relevant user documents.`);
    console.log(`[Embedding] Found ${similarAssistantDocs.length} initial relevant assistant documents.`);

    let combinedInitialDocs = [
        ...similarUserDocs.map(doc => ({ ...doc, source: 'user' })),
        ...similarAssistantDocs.map(doc => ({ ...doc, source: 'assistant' }))
    ];

    // --- Re-ranking with ONLY Statement Boost --- 
    const statementBoostValue = 0.25; // Keep boost for non-questions

    const rescoredDocs = combinedInitialDocs.map(doc => {
        const trimmedName = doc.name.trim();
        let isStatement = false;
        if (!trimmedName.endsWith('?')) {
            // It's not a standard question ending with '?'
            // Now, check if it's likely a statement.
            if (trimmedName.endsWith('.') || trimmedName.endsWith('!')) {
                // Ends with typical statement punctuation.
                isStatement = true;
            } else if (!trimmedName.endsWith('/')) {
                // Does not end with '?' (checked above)
                // Does not end with '.' or '!' (checked above)
                // Does not end with '/' (to filter out cases like "What's my name/")
                // Assume it's a statement fragment (e.g., "My name is Hunter")
                isStatement = true;
            }
        }
        
        const statementBoost = isStatement ? statementBoostValue : 0;
        
        // Apply only statement boost
        const boostedSimilarity = doc.similarity + statementBoost;

        return { ...doc, boostedSimilarity };
    });

    // Sort by the final boosted similarity
    rescoredDocs.sort((a, b) => b.boostedSimilarity - a.boostedSimilarity);
    // --- End Re-ranking --- 

    console.log(`[Embedding] Re-ranked documents (Top 10):`, JSON.stringify(rescoredDocs.slice(0, 10), null, 2));

    // Return the re-ranked list (still up to initialRetrievalLimit*2, route will slice top 5)
    // The route.tsx logic will handle final slicing and filtering
    return rescoredDocs; 
}; 