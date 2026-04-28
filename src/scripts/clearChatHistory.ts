import "dotenv/config";
import mongoose from "mongoose";

async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "chatbots" }).toArray();

    if (collections.length === 0) {
        console.log("No chatbots collection found — nothing to clear.");
    } else {
        // Drop the TTL index so it gets recreated with the new expireAfterSeconds on next server start
        try {
            await db.collection("chatbots").dropIndex("updatedAt_1");
            console.log("Dropped old TTL index (updatedAt_1)");
        } catch {
            console.log("TTL index not found or already dropped");
        }

        const result = await db.collection("chatbots").deleteMany({});
        console.log(`Deleted ${result.deletedCount} chat history document(s)`);
    }

    await mongoose.disconnect();
    console.log("Done — WhatsApp chat history cleared. Restart the server to apply the new 1-hour TTL.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
