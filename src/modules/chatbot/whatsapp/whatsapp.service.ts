import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";
import fs from "fs";
import chatbotService from "../chatbot.services";

// Used only when the DB itself is unreachable and we cannot build a dynamic reply
const LAST_RESORT_REPLY = "شكراً لتواصلك معنا. سيقوم فريقنا بالرد عليك قريباً.";
import type { Server } from "socket.io";

const SERVICE_DIR = path.resolve(__dirname);
const SESSION_DIR = path.resolve(SERVICE_DIR, "../../../../.wwebjs_auth");
const CHROME_PATH = path.resolve(
    SERVICE_DIR,
    "../../../../.chrome-for-testing/chrome-win64/chrome.exe",
);

export class WhatsAppService {
    private client: Client | null = null;
    private io: Server | null = null;
    public isWhatsAppReady: boolean = false;
    public isInitialized: boolean = false;
    public isAutoReplyEnabled: boolean = true;

    private readonly DEBOUNCE_MS = Number.parseInt(
        process.env.WHATSAPP_DEBOUNCE_MS ?? String(3 * 60 * 1000),
        10,
    );
    private messageQueue = new Map<
        string,
        { timer: ReturnType<typeof setTimeout>; buffer: string[] }
    >();

    /** Called once at server startup — stores the Socket.IO reference without starting Chrome. */
    setIo(io: Server): void {
        this.io = io;
    }

    private enqueue(from: string, text: string): void {
        const existing = this.messageQueue.get(from);
        if (existing) {
            clearTimeout(existing.timer);
            existing.buffer.push(text);
        } else {
            this.messageQueue.set(from, { buffer: [text], timer: null! });
        }
        const entry = this.messageQueue.get(from)!;
        entry.timer = setTimeout(() => this.flush(from), this.DEBOUNCE_MS);
    }

    private async flush(from: string): Promise<void> {
        const entry = this.messageQueue.get(from);
        if (!entry) return;
        this.messageQueue.delete(from);

        const aggregated = entry.buffer.join("\n");
        console.log(`[WhatsApp] Flushing ${entry.buffer.length} buffered message(s) from ${from}`);

        let reply: string;
        try {
            reply = await chatbotService.handleWhatsAppChat(aggregated, from);
        } catch {
            reply = LAST_RESORT_REPLY;
        }

        try {
            await this.client?.sendMessage(from, reply);
        } catch (err) {
            console.error("[WhatsApp] Failed to send reply to", from, ":", err);
        }
    }

    /**
     * Starts Chrome + whatsapp-web.js. Only runs once — repeated calls are no-ops.
     * Triggered manually from the admin dashboard, not on server startup.
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!fs.existsSync(CHROME_PATH)) {
            console.error(`[WhatsApp] Chrome not found at ${CHROME_PATH}. Please extract it there.`);
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
                    "--disable-blink-features=AutomationControlled",
                ],
                executablePath: CHROME_PATH,
            },
        });

        this.client.on("qr", (qr) => {
            console.log("[WhatsApp] QR Code received. Emitting to dashboard...");
            this.io?.emit("whatsapp-qr", qr);
        });

        this.client.on("ready", () => {
            if (this.isWhatsAppReady) return;
            console.log("[WhatsApp] Euro-Media Bot Ready");
            this.isWhatsAppReady = true;
            this.io?.emit("whatsapp-ready", true);
        });

        this.client.on("message", (msg) => {
            if (msg.fromMe || msg.from.endsWith("@g.us")) return;
            if (!msg.body?.trim()) return;
            if (!this.isAutoReplyEnabled) return;
            this.enqueue(msg.from, msg.body.trim());
        });

        this.client.on("disconnected", (reason) => {
            console.log("[WhatsApp] Client disconnected:", reason);
            this.isWhatsAppReady = false;
            this.io?.emit("whatsapp-ready", false);
        });

        console.log("[WhatsApp] Starting Chrome and connecting...");
        await this.client.initialize();
    }

    getClient(): Client | null {
        return this.client;
    }
}

export default new WhatsAppService();
