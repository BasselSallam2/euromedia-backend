import mongoose from "mongoose";
import { embedQueryText } from "@modules/chatbot/knowledgeBase.embeddings";
import {
    KNOWLEDGE_BASE_COLLECTION,
    getRagMinSimilarityLocal,
    getRagTopK,
    getVectorSearchIndexName,
    getVectorSearchMode
} from "@modules/chatbot/knowledgeBase.constants";

export type RetrievedChunk = {
    text: string;
    score?: number;
};

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        const x = a[i]!;
        const y = b[i]!;
        dot += x * y;
        na += x * x;
        nb += y * y;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Local/dev path: no `$vectorSearch`. Loads chunk embeddings and picks top‑K by cosine similarity.
 * Fine for small/medium catalogs; set `LOCAL_VECTOR_MAX_CHUNKS` if you need a safety cap.
 */
async function retrieveRelevantChunksLocal(query: string): Promise<RetrievedChunk[]> {
    const topK = getRagTopK();
    const minSim = getRagMinSimilarityLocal();
    const queryVector = await embedQueryText(query);
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("MongoDB is not connected");
    }

    const maxChunks = Math.min(
        Number.parseInt(process.env.LOCAL_VECTOR_MAX_CHUNKS ?? "20000", 10) || 20000,
        100_000
    );

    const coll = db.collection(KNOWLEDGE_BASE_COLLECTION);
    const docs = await coll
        .find(
            { embedding: { $exists: true } },
            { projection: { text: 1, embedding: 1 } }
        )
        .limit(maxChunks)
        .toArray();

    const scored: RetrievedChunk[] = [];
    for (const d of docs) {
        const emb = d.embedding as number[] | undefined;
        const text = String(d.text ?? "");
        if (!emb?.length || !text.trim()) continue;
        const score = cosineSimilarity(queryVector, emb);
        if (minSim > 0 && score < minSim) continue;
        scored.push({
            text,
            score
        });
    }

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return scored.slice(0, topK);
}

/**
 * Runs RAG retrieval: Atlas `$vectorSearch` when `MONGODB_VECTOR_SEARCH_MODE=atlas`, else in-process cosine search (`local`).
 */
export async function retrieveRelevantChunks(query: string): Promise<RetrievedChunk[]> {
    if (getVectorSearchMode() === "local") {
        return retrieveRelevantChunksLocal(query);
    }

    const topK = getRagTopK();
    const queryVector = await embedQueryText(query);
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("MongoDB is not connected");
    }

    const coll = db.collection(KNOWLEDGE_BASE_COLLECTION);
    const indexName = getVectorSearchIndexName();
    const numCandidates = Math.max(150, topK * 50);

    const pipeline = [
        {
            $vectorSearch: {
                index: indexName,
                path: "embedding",
                queryVector,
                numCandidates,
                limit: topK
            }
        },
        {
            $project: {
                text: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ];

    const results = await coll
        .aggregate<{
            text?: string;
            score?: number;
        }>(pipeline)
        .toArray();

    return results.map((r) => ({
        text: String(r.text ?? ""),
        score: typeof r.score === "number" ? r.score : undefined
    }));
}
