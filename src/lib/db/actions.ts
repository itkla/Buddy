import { db } from './index';
import { user_embeddings, assistant_embeddings } from './schema';
import { generateEmbeddings } from '@/lib/ai/embedding';

export async function upsertUserDocumentChunks(content: string, userId?: string) {
    try {
        console.log(`[DB Actions] Generating embeddings for user content chunks: "${content.substring(0, 50)}..."`);
        const contentEmbeddings = await generateEmbeddings(content);
        
        if (!contentEmbeddings || contentEmbeddings.length === 0) {
            console.log("[DB Actions] No valid chunks generated for user content, skipping insert.");
            return;
        }

        console.log(`[DB Actions] Inserting ${contentEmbeddings.length} user embedding chunk(s) into user_embeddings table.`);
        
        const valuesToInsert = contentEmbeddings.map(item => ({
            content: item.content,
            embedding: item.embedding,
        }));

        const result = await db.insert(user_embeddings).values(valuesToInsert).returning({ insertedId: user_embeddings.id });

        console.log(`[DB Actions] Successfully inserted ${result.length} user embedding chunk(s).`);
        return result;
    } catch (error) {
        console.error("[DB Actions] Error in upsertUserDocumentChunks:", error);
        throw new Error("Failed to upsert user document chunks due to an internal error.");
    }
}

/**
 * Splits content into chunks, generates embeddings, and inserts each into the assistant_embeddings table.
 * @param content The raw text content of the assistant's message.
 */
export async function upsertAssistantDocumentChunks(content: string) {
     try {
        console.log(`[DB Actions] Generating embeddings for assistant content chunks: "${content.substring(0,50)}..."`);
        const contentEmbeddings = await generateEmbeddings(content);

        if (!contentEmbeddings || contentEmbeddings.length === 0) {
            console.log("[DB Actions] No valid chunks generated for assistant content, skipping insert.");
            return;
        }

        console.log(`[DB Actions] Inserting ${contentEmbeddings.length} assistant embedding chunk(s) into assistant_embeddings table.`);
        
        const valuesToInsert = contentEmbeddings.map(item => ({
            content: item.content,
            embedding: item.embedding,
        }));

        const result = await db.insert(assistant_embeddings).values(valuesToInsert).returning({ insertedId: assistant_embeddings.id });

        console.log(`[DB Actions] Successfully inserted ${result.length} assistant embedding chunk(s).`);
        return result;
    } catch (error) {
        console.error("[DB Actions] Error in upsertAssistantDocumentChunks:", error);
        throw new Error("Failed to upsert assistant document chunks due to an internal error.");
    }
}