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
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        const x = a[i]!, y = b[i]!;
        dot += x * y; na += x * x; nb += y * y;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}

/** 
 * Local cosine similarity search (In-memory ranking)
 */
async function runLocalSearch(coll: any, queryVector: number[], topK: number): Promise<RetrievedChunk[]> {
    const minSim = getRagMinSimilarityLocal();
    const maxChunks = Math.min(Number.parseInt(process.env.LOCAL_VECTOR_MAX_CHUNKS ?? "20000", 10) || 20000, 100_000);

    const docs = await coll.find({ embedding: { $exists: true } }, { projection: { text: 1, embedding: 1 } })
        .limit(maxChunks).toArray();

    return docs
        .map((d: any) => ({
            text: String(d.text ?? ""),
            score: cosineSimilarity(queryVector, d.embedding as number[])
        }))
        .filter(c => c.text.trim() && (minSim <= 0 || (c.score ?? 0) >= minSim))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, topK);
}

/** 
 * Atlas $vectorSearch (Cloud/Managed ranking)
 */
async function runAtlasSearch(coll: any, queryVector: number[], topK: number): Promise<RetrievedChunk[]> {
    const indexName = getVectorSearchIndexName();
    const numCandidates = Math.max(150, topK * 50);

    const pipeline = [
        { $vectorSearch: { index: indexName, path: "embedding", queryVector, numCandidates, limit: topK } },
        { $project: { text: 1, score: { $meta: "vectorSearchScore" } } }
    ];

    const results = await coll.aggregate(pipeline).toArray();
    return (results as any[]).map(r => ({
        text: String(r.text ?? ""),
        score: typeof r.score === "number" ? r.score : undefined
    }));
}

/**
 * Unified RAG retrieval: Dispatches to Atlas or Local search mode while sharing embedding logic.
 */
export async function retrieveRelevantChunks(query: string): Promise<RetrievedChunk[]> {
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB is not connected");

    const topK = getRagTopK();
    const queryVector = await embedQueryText(query);
    const collection = db.collection(KNOWLEDGE_BASE_COLLECTION);

    return getVectorSearchMode() === "local"
        ? runLocalSearch(collection, queryVector, topK)
        : runAtlasSearch(collection, queryVector, topK);
}
