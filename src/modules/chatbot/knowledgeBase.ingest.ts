import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import {
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    KNOWLEDGE_BASE_COLLECTION,
    defaultCatalogSourcePath
} from "@modules/chatbot/knowledgeBase.constants";
import { embedDocumentTextsBatched } from "@modules/chatbot/knowledgeBase.embeddings";

export type IngestCatalogOptions = {
    /**
     * Catalog file path. Defaults to `CATALOG_SOURCE_PATH` or `public/docs/CatalogFinal.md`.
     * Markdown/text are read as UTF-8; `.pdf` uses PDF text extraction.
     */
    catalogPath?: string;
    /** When true, deletes all documents in `knowledge_base` before insert */
    clearExisting?: boolean;
};

async function loadCatalogText(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Catalog file not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        try {
            const textResult = await parser.getText();
            return textResult.text.trim();
        } finally {
            await parser.destroy();
        }
    }

    if (ext === ".md" || ext === ".txt" || ext === ".markdown") {
        return fs.readFileSync(filePath, "utf-8").trim();
    }

    // Fallback: treat as UTF-8 text
    return fs.readFileSync(filePath, "utf-8").trim();
}

/**
 * Loads the catalog (Markdown by default), splits, embeds with Gemini, and writes to `knowledge_base`.
 * After switching embedding models, run with `--clear` so stored vectors match retrieval.
 * Run: `bun run ingest:knowledge` (use `--clear` to replace chunks).
 */
export async function ingestCatalogToKnowledgeBase(
    options: IngestCatalogOptions = {}
): Promise<{ chunksInserted: number }> {
    const catalogPath = options.catalogPath ?? defaultCatalogSourcePath();
    const fullText = await loadCatalogText(catalogPath);

    if (!fullText) {
        throw new Error("Catalog file is empty or no text could be extracted");
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP
    });
    const chunks = await splitter.splitText(fullText);
    if (chunks.length === 0) {
        return { chunksInserted: 0 };
    }

    const vectors = await embedDocumentTextsBatched(chunks);

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("MongoDB is not connected");
    }

    const coll = db.collection(KNOWLEDGE_BASE_COLLECTION);
    if (options.clearExisting) {
        await coll.deleteMany({});
    }

    const sourceName = path.basename(catalogPath);
    const now = new Date();
    const docs = chunks.map((text, chunkIndex) => ({
        text,
        embedding: vectors[chunkIndex],
        chunkIndex,
        source: sourceName,
        createdAt: now
    }));

    await coll.insertMany(docs, { ordered: false });

    return { chunksInserted: docs.length };
}

/** @deprecated Use `ingestCatalogToKnowledgeBase` */
export const ingestCatalogPdfToKnowledgeBase = ingestCatalogToKnowledgeBase;
