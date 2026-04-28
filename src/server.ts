import { connectDB } from "@config/db";
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import { defaultSeeders } from "./seeders/defualtSeeders";
import { createServer } from "http";
import { Server } from "socket.io";
import whatsappService from "@modules/chatbot/whatsapp/whatsapp.service";

const PORT = process.env.PORT || 3000;
const FLUSH_DB = process.argv.includes("--flush");

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const startServer = async () => {
    if (process.env.NODE_ENV === "DEVELOPMENT") {
        process.stdout.write("\x1Bc");
    }
    await connectDB(process.env.MONGO_URI!);
    console.log("FLUSH_DB", FLUSH_DB);

    // ... existing flush and seeder logic ...
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

    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        // Store the Socket.IO server so the WhatsApp service can emit events
        // when the admin starts it from the dashboard. Do NOT auto-initialize.
        whatsappService.setIo(io);
    });
};

startServer();
