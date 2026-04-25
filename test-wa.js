import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

console.log("Starting debug script...");

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'debug-auth' }),
    puppeteer: {
        headless: "new", // test headless explicitly
        executablePath: "H:\\EURO-MEDIA\\implementaion\\euro-media-shine\\backend\\.chrome-for-testing\\chrome-win64\\chrome.exe",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote"
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECIEVED:', qr);
});

client.on('ready', () => {
    console.log('CLIENT READY');
    process.exit(0);
});

client.on('auth_failure', (msg) => {
    console.error('AUTH FAILURE:', msg);
});

client.on('disconnected', (reason) => {
    console.log('DISCONNECTED:', reason);
});

console.log("Initializing client...");
client.initialize().then(() => {
    console.log("Initialize function resolved (does not mean ready yet)");
}).catch(err => {
    console.error("Initialize failed with error:", err);
});
