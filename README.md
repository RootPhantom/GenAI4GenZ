# Health Monitoring Agent

A clean and human-friendly health dashboard built with pure HTML, CSS, and JavaScript.

## Quick Start (HTML + CSS version)

1. Go to project folder:

	```bash
	cd /workspaces/GenAI4GenZ
	```

2. Run static server:

	```bash
	npm run static
	```

3. Open in browser:

	```
	http://localhost:5500
	```

Main static files:

- `index.html`
- `styles.css`
- `script.js`

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
- `.env.anurag` is safe template only.
- Keep real keys only in local `.env.local`.

## Important note

This is an educational health assistant and **not a medical diagnosis system**.

**Stay Safe:- @ANURAG SINGH(RootPhantom)**


# Use input.md file to understand the inputss


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