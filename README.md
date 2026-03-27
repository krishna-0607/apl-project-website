# APL Project Chatbot Backend

This project uses a local Node backend with the official `@google/genai` SDK.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create `.env` from `.env.example` and set your Gemini API key:

```env
GEMINI_API_KEY=your_new_google_ai_studio_key_here
GEMINI_MODEL=Gemini 3.1 Flash Lite
PORT=3000
CLIENT_ORIGIN=http://127.0.0.1:5500,http://localhost:5500
```

Notes:
- `CLIENT_ORIGIN` accepts one or more comma-separated origins.
- Do not place API keys in frontend files.

## 3) Start API server

```bash
npm start
```

Server routes:
- `GET /api/health`
- `POST /api/chat`

## 4) Run frontend

Serve this folder with Live Server (or any static server), then open the page.

The chatbot in `script.js` sends requests to:
- `http://localhost:3000/api/chat`
