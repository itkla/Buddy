import { pgTable, serial, text, timestamp, vector } from 'drizzle-orm/pg-core';

// export const embeddings = pgTable('embeddings', {
//   id: serial('id').primaryKey(),
//   content: text('content').notNull(),
//   embedding: vector('embedding', { dimensions: 1536 }).notNull(), // Assuming 1536 dimensions for the embedding model
//   createdAt: timestamp('created_at').defaultNow().notNull(),
// }); 

// Table for storing user message embeddings
export const user_embeddings = pgTable('user_embeddings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table for storing assistant message embeddings
export const assistant_embeddings = pgTable('assistant_embeddings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 