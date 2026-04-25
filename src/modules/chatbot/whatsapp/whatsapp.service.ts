import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";
import fs from "fs";
import chatbotService from "../chatbot.services";
import type { Server } from "socket.io";

// __dirname is always the directory of this file, regardless of where Bun is invoked from
const SERVICE_DIR = path.resolve(__dirname);
const SESSION_DIR = path.resolve(SERVICE_DIR, "../../../../.wwebjs_auth");
const CHROME_PATH = path.resolve(SERVICE_DIR, "../../../../.chrome-for-testing/chrome-win64/chrome.exe");

export class WhatsAppService {
    private client: Client | null = null;
    private io: Server | null = null;
    public isWhatsAppReady: boolean = false;

    constructor() { }

    async initialize(socketIoServer: Server) {
        this.io = socketIoServer;

        const chromePath = CHROME_PATH;

        if (!fs.existsSync(chromePath)) {
            console.error(`[WhatsApp] Chrome not found at ${chromePath}. Please extract it there.`);
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: process.env.WHATSAPP_CLIENT_ID || "euro-media-production",
                dataPath: SESSION_DIR,
            }),
            puppeteer: {
                headless: "new",
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--disable-gpu",
                    "--window-size=1920,1080",
                    "--disable-blink-features=AutomationControlled"
                ],
                executablePath: chromePath,
            }
        });

        this.client.on("qr", (qr) => {
            console.log("[WhatsApp] QR Code received. Emitting to dashboard...");

            // Emit QR to frontend via Socket.io
            if (this.io) {
                this.io.emit("whatsapp-qr", qr);
            }
        });

        this.client.on("ready", () => {
            console.log("[WhatsApp] Euro-Media Bot Ready");
            this.isWhatsAppReady = true;
            if (this.io) {
                this.io.emit("whatsapp-ready", true);
            }
        });

        this.client.on("message", async (msg) => {
            if (msg.fromMe || msg.from.endsWith("@g.us")) return;

            try {
                const response = await chatbotService.handleChat(msg.body, msg.from);
                await msg.reply(response);
            } catch (err) {
                console.error("[WhatsApp] Error handling message:", err);
            }
        });

        this.client.on("disconnected", (reason) => {
            console.log("[WhatsApp] Client disconnected:", reason);
            this.isWhatsAppReady = false;
            if (this.io) {
                this.io.emit("whatsapp-ready", false);
            }
        });

        await this.client.initialize();
    }

    getClient() {
        return this.client;
    }
}

export default new WhatsAppService();
