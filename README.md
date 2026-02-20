# Health Monitoring Agent

A clean and human-friendly health dashboard built with pure HTML, CSS, and JavaScript.

## Quick Start (HTML + CSS version)

1. Go to project folder:

	```bash
	cd /GenAI4GenZ
	```

2. Run static server:

	```bash
	npm run dev
	```

3. Open in browser:

	```
	http://localhost:5500
	```

Main static files:

- `index.html`
- `styles.css`
- `script.js`
- `server.js`

Project feature reference:

- `silly_codder_rootphantom.md`

## Secure API Key Setup (Chatbot)

1. Create your local env file (never commit real keys):

	```bash
	# Use .env.anurag directly for all project env values
	```

2. Add your keys in `.env.anurag`:

	```dotenv
	# Option A: OpenAI
	OPENAI_API_KEY=your_real_key_here
	OPENAI_MODEL=gpt-4o-mini

	# Option B: Gemini
	GEMINI_API_KEY=your_real_key_here
	GEMINI_MODEL=gemini-1.5-flash

	# Optional: chat API protection
	CHAT_RATE_LIMIT_WINDOW_MS=300000
	CHAT_RATE_LIMIT_MAX_REQUESTS=30
	ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
	```

3. Start app:

	```bash
	npm run dev
	```

## Required Keys Checklist

Update `/.env.anurag` before running the app:

- [ ] `OPENAI_API_KEY` (optional if using Gemini only)
- [ ] `GEMINI_API_KEY` (optional if using OpenAI only)
- [ ] At least one provider key is set (`OPENAI_API_KEY` or `GEMINI_API_KEY`)
- [ ] `OPENAI_MODEL` or `GEMINI_MODEL` (defaults are already provided)
- [ ] `ALLOWED_ORIGINS` includes your local/frontend origin
- [ ] `CHAT_RATE_LIMIT_WINDOW_MS` and `CHAT_RATE_LIMIT_MAX_REQUESTS` set as desired

How security works:

- Frontend never stores or exposes `OPENAI_API_KEY`.
- Frontend never stores or exposes `GEMINI_API_KEY`.
- Keys are used only in `server.js` via `/api/chat`.
- `/api/chat` includes per-IP rate limiting (default: 30 requests / 5 minutes).
- `/api/chat` checks request `Origin` against `ALLOWED_ORIGINS`.
- `.env` and `.env.*` are ignored by git.

## Project structure (simple)

- `index.html` → page layout and sections
- `styles.css` → design, responsive layout, colors, spacing
- `script.js` → health score logic, compression-like summary, chatbot behavior
- `.env.anurag` → safe template for local environment keys
- `.gitignore` → protects local secrets (`.env`, `.env.*`)

## What this static version includes

- Health dashboard with score and risk badge
- Health input form (history, symptoms, vitals, habits)
- Compression-style summary and encoded payload
- Recommendation list based on health input
- Simple chatbot responses based on latest processed data
- Fully responsive layout with modern medical color theme

## Credentials and Environment Safety

- `.env` and `.env.*` are ignored in git.
- `.env.anurag` is the primary environment file for this project.

Before pushing to GitHub, run:

```bash
npm run security:check
```

## Important note

This is an educational health assistant and **not a medical diagnosis system**.

If you want to use the source code please tag the developer.

**Stay Safe:- @ANURAG SINGH(RootPhantom)**


# Use input.md file to understand the inputs


### Expected Behavior
- Health score should be high
- Risk likely `Low`
- Fewer or no risk flags
- Recommendations should be minimal / maintain routine

---

## Chatbot Test Prompts

After submitting a form case, try these in chatbot:

1. `How is my health?`
2. `Summarize my medical history`
3. `What should I improve?`
4. `Give me recommendations`
5. `Am I at risk?`

### Expected Chatbot Responses
- Should reference latest processed data
- Should show score/risk when asked about health
- Should return summary when asked to summarize
- Should provide practical suggestions for improvement prompts