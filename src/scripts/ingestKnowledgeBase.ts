import "dotenv/config";
import mongoose from "mongoose";
import { ingestCatalogToKnowledgeBase } from "@modules/chatbot/knowledgeBase.ingest";

const clearExisting = process.argv.includes("--clear");

async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri, { maxPoolSize: 30, minPoolSize: 5 });
    console.log("MongoDB connected successfully");

    try {
        const { chunksInserted } = await ingestCatalogToKnowledgeBase({ clearExisting });
        console.log(`Ingested ${chunksInserted} chunks into collection "knowledge_base".`);
    } finally {
        await mongoose.connection.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
