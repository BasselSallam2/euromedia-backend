import { Router } from "express";
import whatsappService from "./whatsapp.service";

const router = Router();

router.get("/status", (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            isInitialized: whatsappService.isInitialized,
            isReady: whatsappService.isWhatsAppReady,
            isAutoReplyEnabled: whatsappService.isAutoReplyEnabled,
        },
    });
});

// Starts Chrome + whatsapp-web.js on demand. Safe to call multiple times (no-op if already started).
router.post("/start", (req, res) => {
    if (whatsappService.isInitialized) {
        return res.status(200).json({
            status: "success",
            data: { message: "Already started" },
        });
    }
    // Fire and forget — client emits whatsapp-qr / whatsapp-ready via Socket.IO
    whatsappService.initialize().catch((err) => {
        console.error("[WhatsApp] Initialization failed:", err);
    });
    res.status(200).json({
        status: "success",
        data: { message: "WhatsApp starting…" },
    });
});

router.post("/toggle-autoreply", (req, res) => {
    whatsappService.isAutoReplyEnabled = !whatsappService.isAutoReplyEnabled;
    const state = whatsappService.isAutoReplyEnabled;
    console.log(`[WhatsApp] Auto-reply ${state ? "enabled" : "disabled"} by admin`);
    res.status(200).json({
        status: "success",
        data: { isAutoReplyEnabled: state },
    });
});

export default router;
