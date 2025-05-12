# Buddy

An AI/Chatbot agent built using Vercel's AI SDK and Next.js.

This project provides a flexible chatbot interface that can connect to various AI models like OpenAI, Anthropic, and Groq. It utilizes Drizzle ORM for database interactions and Tailwind CSS for styling.

## Features
- RAG using pgvector (kinda buggy)
- Generative UI via tool calling

## Requirements

- Node.js (v20 or higher recommended)
- pnpm (or npm/yarn)
- PostgreSQL + pgvector plugin

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd buddy
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory, or copy `.env.example`.
   - You will need API keys for the AI services you intend to use (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`).
   - Configure your database connection string (e.g., `POSTGRES_URL` for Postgres). Refer to Drizzle ORM documentation if using a different database.
   - Example `.env` content:
     ```env
     OPENAI_API_KEY=your_openai_api_key
     GROQ_API_KEY=your_groq_api_key
     POSTGRES_URL=your_database_connection_string
     ```
   - Run database migrations (if applicable, depending on your database setup):
     ```bash
     pnpm drizzle-kit generate
     # Apply migrations (command might vary based on DB provider)
     pnpm drizzle-kit migrate
     ```

4. Run the development server:
   ```bash
   pnpm run dev
   ```

   The application should now be running on [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
pnpm build
pnpm start
```
