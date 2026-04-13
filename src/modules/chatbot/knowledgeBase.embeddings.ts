import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import {
    getEmbeddingDimensions,
    getGeminiApiKey,
    getGeminiEmbeddingModel
} from "@modules/chatbot/knowledgeBase.constants";

function getEmbeddingGenerativeModel() {
    const genAI = new GoogleGenerativeAI(getGeminiApiKey());
    return genAI.getGenerativeModel({ model: getGeminiEmbeddingModel() });
}

function assertVector(values: number[], context: string): number[] {
    if (!values.length) {
        throw new Error(`Empty embedding (${context})`);
    }
    const expected = getEmbeddingDimensions();
    if (values.length !== expected) {
        throw new Error(
            `Embedding dimension mismatch (${context}): expected ${expected}, got ${values.length}. Set EMBEDDING_DIMENSIONS in .env to ${values.length} (and match your Atlas vector index), then re-ingest with --clear.`
        );
    }
    return values;
}

export async function embedQueryText(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error("Cannot embed empty query");
    }

    const model = getEmbeddingGenerativeModel();
    const res = await model.embedContent({
        content: { role: "user", parts: [{ text: trimmed }] },
        taskType: TaskType.RETRIEVAL_QUERY
    });

    return assertVector(res.embedding.values, "query");
}

const DOCUMENT_EMBED_BATCH_SIZE = 100;

export async function embedDocumentTextsBatched(chunks: string[]): Promise<number[][]> {
    if (chunks.length === 0) return [];

    const model = getEmbeddingGenerativeModel();
    const out: number[][] = [];

    for (let i = 0; i < chunks.length; i += DOCUMENT_EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + DOCUMENT_EMBED_BATCH_SIZE);
        const requests = batch.map((c) => ({
            content: {
                role: "user" as const,
                parts: [{ text: c.trim().length === 0 ? " " : c }]
            },
            taskType: TaskType.RETRIEVAL_DOCUMENT
        }));

        const res = await model.batchEmbedContents({ requests });
        const embeddings = res.embeddings;

        if (embeddings.length !== batch.length) {
            throw new Error(
                `Embedding batch size mismatch: expected ${batch.length}, got ${embeddings.length}`
            );
        }

        for (let j = 0; j < embeddings.length; j++) {
            out.push(assertVector(embeddings[j]!.values, `document chunk ${i + j}`));
        }
    }

    return out;
}
