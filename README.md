# APL Project Chatbot Backend

This project uses a Node backend with the official `@google/genai` SDK.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create `.env` from `.env.example` and set your values:

```env
GEMINI_API_KEY=your_new_google_ai_studio_key_here
GEMINI_MODEL=Gemini 3.1 Flash Lite
PORT=3000
CLIENT_ORIGIN=http://127.0.0.1:5500,http://localhost:5500,https://krishna-0607.github.io
ENQUIRY_TO=your_receiver_email@example.com
SMTP_USER=your_smtp_email@example.com
SMTP_PASS=your_smtp_app_password
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

## 5) Make chatbot work on deployed GitHub Pages site

GitHub Pages hosts only static files, so deploy `server.js` separately (Render/Railway/other Node host):

1. Deploy backend and get public URL (example: `https://apl-backend.onrender.com`).
2. In backend host environment variables, set:
	- `GEMINI_API_KEY`
	- `GEMINI_MODEL`
	- `PORT`
	- `CLIENT_ORIGIN=https://krishna-0607.github.io,http://127.0.0.1:5500,http://localhost:5500`
	- `ENQUIRY_TO`, `SMTP_USER`, `SMTP_PASS`
3. In frontend, `script.js` uses this production URL by default:
	- `https://apl-backend.onrender.com`
4. Optional: override API URL without editing JS by setting before `script.js` loads:

```html
<script>
  window.APL_API_BASE = "https://your-backend-url.onrender.com";
</script>
```

5. Verify backend health:
	- `GET https://your-backend-url.onrender.com/api/health`
6. Push frontend updates to GitHub; chatbot then works from deployed GitHub Pages site.
