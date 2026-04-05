import { connectDB } from "@config/db";
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import { defaultSeeders } from "./seeders/defualtSeeders";

const PORT = process.env.PORT || 3000;
const FLUSH_DB = process.argv.includes("--flush");

const startServer = async () => {
    if (process.env.NODE_ENV === "DEVELOPMENT") {
        process.stdout.write("\x1Bc");
    }
    await connectDB(process.env.MONGO_URI!);
    console.log("FLUSH_DB", FLUSH_DB);
    if (FLUSH_DB) {
        const conn = mongoose.connection;
        const collections = await conn.db.listCollections().toArray();
        for (const { name } of collections) {
            await conn.db.collection(name).drop();
            console.log(`[Seeder] ✓ ${name} dropped`);
        }
        console.log("Database flushed");
    }
    for (const { name, fn } of defaultSeeders) {
        try {
            await fn();
            console.log(`[Seeder] ✓ ${name} completed`);
        } catch (err) {
            console.error(`[Seeder] ✗ ${name} failed:`, err);
            throw err;
        }
    }
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
