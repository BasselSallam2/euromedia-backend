import fs from "fs";
import i18next from "i18next";
import backend from "i18next-fs-backend";
import { LanguageDetector } from "i18next-http-middleware";
import path from "path";

const root = process.cwd();

const en = JSON.parse(fs.readFileSync(path.join(root, "translation/en.json"), "utf-8"));
const ar = JSON.parse(fs.readFileSync(path.join(root, "translation/ar.json"), "utf-8"));

i18next
    .use(LanguageDetector)
    .use(backend)
    .init({
        fallbackLng: "en",
        resources: {
            en: { translation: en },
            ar: { translation: ar },
        },
        detection: {
            order: ["header"],
        },
        interpolation: {
            escapeValue: false,
        },
    });

export { i18next };
