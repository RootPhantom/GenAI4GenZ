# Silly Codder RootPhantom – Project Features

This document summarizes all key features available in the Health Monitoring Agent project.

## 1) Smart Health Input & Analysis

- User can submit complete health details from the form:
  - Name, age, medical history, symptoms, medications
  - Heart rate, blood pressure, sleep hours, step count
  - Exercise habits, diet habits, stress level
- App calculates a health score automatically.
- App detects risk level (`Low`, `Medium`, `High`).
- App generates risk flags (heart-rate issues, sleep deficit, low activity, BP-related flags, stress indicators, etc.).
- App detects condition patterns (for example hypertension risk, respiratory concern, cardiac stress pattern, and more).

## 2) Dashboard + Visual Health Status

- Live dashboard sections show:
  - Health score
  - Risk badge
  - Health condition ring and condition label
  - Compressed summary output
- UI updates instantly after form submission.

## 3) Compression Output

- App creates compressed-style summary payload and displays it.
- Risk flags and summary are visible in dedicated output sections.

## 4) Personalized Recommendations & Advices

- Recommendations are generated automatically based on submitted data.
- Advice list includes practical actions for:
  - Sleep improvement
  - Activity improvement
  - Diet improvement
  - Stress management
  - Condition-specific suggestions

## 5) AI Chatbot (Bubble + Messenger Window)

- Floating chatbot bubble on the right side opens mini messenger window.
- Chat works from both:
  - Main chatbot section
  - Mini messenger popup
- Bot supports:
  - Greeting conversations (example: “hello”)
  - Health score and risk questions
  - Flags and detected condition questions
  - Doctor review guidance
  - Vitals and summary-related questions
  - Symptom-relief style guidance for common queries
- Confidence-style response behavior is supported.
- Server-backed AI providers are integrated securely (OpenAI/Gemini via backend).
- Local fallback chatbot logic is available if provider call fails.

## 6) Secure API-Key Usage

- API keys are not exposed in frontend.
- Keys are consumed only by backend chat endpoint (`/api/chat`).
- Environment-driven secure config is used.
- Security controls include:
  - Rate limiting on chat API
  - Origin allowlist checks
  - Secret scanning script (`npm run security:check`)

## 7) Health Report Card + PDF Download

- Auto-generated report card includes:
  - Patient details
  - Health score and level
  - Risks and detected conditions
  - Doctor review suggestion
  - Health report summary and advices
- PDF download is available via button.
- PDF features include:
  - Proper wrapped text for long content
  - Multi-page handling for long reports
  - Repeated header on continuation pages
  - Footer metadata with page numbering
  - Branding/logo and watermark handling

## 8) Left Sidebar Profile + History Tracking

- Sidebar profile section shows patient name.
- History list stores recent health history entries.
- Tracks latest records with date, risk, score, and summary snippet.
- History persistence is implemented.
- Auto-reset behavior after one week is supported.

## 9) Developer Connect Features

- Footer includes developer identity and profile photo.
- LinkedIn button is available to connect with developer:
  - https://www.linkedin.com/in/anurag-singh0041
- GitHub button is available to follow developer projects:
  - https://www.github.com/rootphantom

## 10) UI/UX Features

- Clean responsive layout for desktop and mobile.
- Sticky sidebar navigation.
- Distinct report and dashboard cards.
- Floating chatbot interaction model.
- Footer social links with icons.

## 11) Project Safety & Readiness

- Git ignore protections for env files.
- Security check script for push-time hygiene.
- Configured for local run using Node server.
- Documentation includes setup and required keys checklist.

## 12) Security Check Guide

Run the security check before push:

```bash
npm run security:check
```

If output is:

```text
✅ Security check passed. No obvious secrets detected.
```

then you are good to push on GitHub.

---

## Quick Use Flow

1. Open app and fill health form.
2. Submit to generate score, risks, conditions, and advices.
3. Review report card and compression output.
4. Ask questions in chatbot (popup or main section).
5. Download PDF report.
6. Track history from left sidebar.
7. Connect with developer using LinkedIn/GitHub footer links.

---

**If you want to use the source code please tag the developer.**
