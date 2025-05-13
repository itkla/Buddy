import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { user_embeddings } from '../db/schema';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string, minChunkLength = 5): string[] => {
  if (!input) return [];

  const cleanedInput = input.trim().replace(/\s+/g, ' ');

  const potentialChunks = cleanedInput.match(/[^.?!]+[.?!]?/g) || [];

  return potentialChunks
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length >= minChunkLength);
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
  const similarity = sql<number>`1 - (${cosineDistance(user_embeddings.embedding, userQueryEmbedded)})`;
  const similarDocs = await db.select({ name: user_embeddings.content, similarity }).from(user_embeddings).where(gt(similarity, 0.5)).orderBy(desc(similarity)).limit(4);
  console.log(`[Embedding] Found ${similarDocs.length} relevant user documents.`);
  return similarDocs;
}; 