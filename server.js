import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const allowedOrigins = CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    }
}));
app.use(express.json());
app.use(express.static(__dirname));

const modelCandidates = [
    process.env.GEMINI_MODEL || "Gemini 3.1 Flash Lite",
    "Gemini 3.1 Flash Lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
];

const modelAliases = {
    "Gemini 3.1 Flash Lite": "gemini-2.5-flash",
    "Gemini 3.1 Flash": "gemini-2.5-flash"
};

const normalizeModelName = (name) => {
    const value = String(name || "").trim();
    const mappedValue = modelAliases[value] || value;
    if (!value) {
        return "models/gemini-2.5-flash";
    }
    return mappedValue.startsWith("models/") ? mappedValue : `models/${mappedValue}`;
};

const key = process.env.GEMINI_API_KEY;
const ai = key ? new GoogleGenAI({ apiKey: key }) : null;
const enquiryReceiver = process.env.ENQUIRY_TO || "Bhavan9305@gmail.com";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailTransporter = smtpUser && smtpPass ? nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: smtpUser,
        pass: smtpPass
    }
}) : null;

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "apl-chat-api" });
});

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/chat", async (req, res) => {
    if (!ai) {
        return res.status(500).json({
            error: "Server missing GEMINI_API_KEY. Add it to .env and restart server."
        });
    }

    const message = String(req.body?.message || "").trim();
    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    const prompt = `You are a helpful assistant for the Automatic Pantograph Lifter project website. Keep answers concise, practical, and project-specific. User question: ${message}`;
    let lastError = "Gemini request failed.";

    for (const model of modelCandidates) {
        try {
            const response = await ai.models.generateContent({
                model: normalizeModelName(model),
                contents: prompt
            });

            const text = (response?.text || "").trim();
            if (text) {
                return res.json({ reply: text, model });
            }

            lastError = `Model ${model} returned empty output.`;
        } catch (error) {
            lastError = error?.message || String(error);
            if (/not found|unsupported|model/i.test(lastError)) {
                continue;
            }
            break;
        }
    }

    return res.status(502).json({ error: `Gemini API error: ${lastError}` });
});

app.post("/api/enquiry", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
    }

    if (!mailTransporter) {
        return res.status(500).json({
            error: "Email is not configured on server. Set SMTP_USER and SMTP_PASS in .env."
        });
    }

    try {
        await mailTransporter.sendMail({
            from: smtpUser,
            to: enquiryReceiver,
            subject: `Project Enquiry from ${name}`,
            replyTo: email,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `<h3>Project Enquiry</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`
        });

        return res.json({ ok: true, sentTo: enquiryReceiver });
    } catch (error) {
        return res.status(502).json({ error: `Email send failed: ${error.message}` });
    }
});

app.listen(PORT , () => {
    console.log(`APL chat API listening on http://localhost:${PORT}`);
});
