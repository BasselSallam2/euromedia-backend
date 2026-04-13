import path from "path";

/** MongoDB collection storing chunked text + embeddings for RAG */
export const KNOWLEDGE_BASE_COLLECTION = "knowledge_base";

/**
 * Gemini embedding model for RAG only (chat uses Groq). Override with `GEMINI_EMBEDDING_MODEL`.
 */
export function getGeminiEmbeddingModel(): string {
    return process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
}

/**
 * Must match the vector length returned by your embedding model and the Atlas index on `embedding`.
 * `gemini-embedding-001` via the Gemini API returns **3072** by default (not 768).
 * Override with `EMBEDDING_DIMENSIONS` or `GEMINI_EMBEDDING_DIMENSIONS` in `.env` if you use another model.
 */
export function getEmbeddingDimensions(): number {
    const raw =
        process.env.EMBEDDING_DIMENSIONS?.trim() || process.env.GEMINI_EMBEDDING_DIMENSIONS?.trim();
    if (raw) {
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n) && n > 0) {
            return n;
        }
    }
    return 3072;
}

export function getGeminiApiKey(): string {
    const key = process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
    if (!key) {
        throw new Error("Missing GOOGLE_API_KEY or GEMINI_API_KEY (required for Gemini RAG embeddings)");
    }
    return key;
}

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

/** Default chunks passed to the model after retrieval. Override with `RAG_TOP_K` (1–12). */
export const RAG_TOP_K_DEFAULT = 3;

export function getRagTopK(): number {
    const n = Number.parseInt(process.env.RAG_TOP_K ?? String(RAG_TOP_K_DEFAULT), 10);
    if (Number.isNaN(n)) return RAG_TOP_K_DEFAULT;
    return Math.min(12, Math.max(1, n));
}

/**
 * Local cosine search only: drop chunks below this similarity (0–1). 0 = no filter.
 * Try `0.2`–`0.35` if retrieval feels noisy.
 */
export function getRagMinSimilarityLocal(): number {
    const x = Number.parseFloat(process.env.RAG_MIN_SIMILARITY ?? "0");
    if (Number.isNaN(x)) return 0;
    return Math.min(1, Math.max(0, x));
}

/**
 * - `atlas` — use `$vectorSearch` (MongoDB Atlas or Atlas CLI local with Search enabled).
 * - `local` — plain `mongod` / Docker: load embeddings from `knowledge_base` and rank by cosine similarity in Node (no Atlas index).
 */
export type VectorSearchMode = "atlas" | "local";

export function getVectorSearchMode(): VectorSearchMode {
    const m = (process.env.MONGODB_VECTOR_SEARCH_MODE ?? "atlas").toLowerCase();
    return m === "local" ? "local" : "atlas";
}

export function getVectorSearchIndexName(): string {
    return process.env.MONGODB_VECTOR_INDEX_NAME ?? "knowledge_base_vector_index";
}

/**
 * Default catalog for RAG ingest: curated Markdown (set `CATALOG_SOURCE_PATH` to override).
 * Use `.md` / `.txt` as UTF-8; paths ending in `.pdf` still use PDF parsing.
 */
export function defaultCatalogSourcePath(): string {
    if (process.env.CATALOG_SOURCE_PATH?.trim()) {
        return path.resolve(process.cwd(), process.env.CATALOG_SOURCE_PATH.trim());
    }
    return path.join(process.cwd(), "public/docs/CatalogFinal.md");
}
