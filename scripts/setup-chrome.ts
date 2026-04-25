/**
 * Downloads a compatible Chrome for Testing binary directly from Google's CDN.
 * Bypasses Puppeteer's broken postinstall / npx machinery on Windows.
 *
 * Run once: bun run setup:chrome
 * Then start the backend normally.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const CACHE_DIR = path.resolve(process.cwd(), ".chrome-for-testing");
const ENV_FILE = path.resolve(process.cwd(), ".env");
const VERSIONS_URL =
    "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json";

type CftResponse = {
    channels: {
        Stable: {
            version: string;
            downloads: { chrome: Array<{ platform: string; url: string }> };
        };
    };
};

console.log("Fetching latest stable Chrome for Testing version...");
const res = await fetch(VERSIONS_URL);
if (!res.ok) throw new Error(`Failed to fetch version info: ${res.status}`);

const data = (await res.json()) as CftResponse;
const stable = data.channels.Stable;
const version = stable.version;
const downloadUrl = stable.downloads.chrome.find((d) => d.platform === "win64")?.url;

if (!downloadUrl) throw new Error("Could not find win64 Chrome download URL");

console.log(`Latest stable Chrome: ${version}`);

mkdirSync(CACHE_DIR, { recursive: true });
const zipPath = path.join(CACHE_DIR, `chrome-win64-${version}.zip`);
const extractDir = path.join(CACHE_DIR, version);
const executablePath = path.join(extractDir, "chrome-win64", "chrome.exe");

if (existsSync(executablePath)) {
    console.log(`Chrome already installed at:\n  ${executablePath}`);
} else {
    // Download
    if (!existsSync(zipPath)) {
        console.log(`Downloading ${downloadUrl}`);
        const dlRes = await fetch(downloadUrl);
        if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);

        const total = parseInt(dlRes.headers.get("content-length") ?? "0");
        const writer = require("fs").createWriteStream(zipPath);
        const reader = dlRes.body!.getReader();
        let downloaded = 0;

        await new Promise<void>((resolve, reject) => {
            const processChunks = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        writer.write(value);
                        downloaded += value.length;
                        if (total > 0) {
                            const pct = Math.round((downloaded / total) * 100);
                            const mb = Math.round(downloaded / 1024 / 1024);
                            const totalMb = Math.round(total / 1024 / 1024);
                            process.stdout.write(`\r  Downloading: ${pct}% (${mb}/${totalMb} MB)  `);
                        }
                    }
                    writer.end();
                } catch (err) {
                    reject(err);
                }
            };

            writer.on("finish", resolve);
            writer.on("error", reject);
            processChunks();
        });

        process.stdout.write("\n");
        console.log("Download complete.");
    } else {
        console.log(`Using cached zip: ${zipPath}`);
    }

    // Extract using PowerShell (always available on Windows)
    console.log("Extracting...");
    execSync(
        `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`,
        { stdio: "inherit" }
    );
    console.log("Extraction complete.");
}

// Update .env
const escapedPath = executablePath.replace(/\\/g, "\\\\");
const envKey = "PUPPETEER_EXECUTABLE_PATH";
let envContent = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf-8") : "";

if (new RegExp(`^${envKey}=`, "m").test(envContent)) {
    envContent = envContent.replace(new RegExp(`^${envKey}=.*`, "m"), `${envKey}=${escapedPath}`);
} else {
    envContent = envContent.trimEnd() + `\n\n# Chrome for Testing binary (set by setup:chrome)\n${envKey}=${escapedPath}\n`;
}

writeFileSync(ENV_FILE, envContent);

console.log(`\n.env updated:`);
console.log(`  ${envKey}=${executablePath}`);
console.log("\nSetup complete. You can now start the backend with: bun run dev");
