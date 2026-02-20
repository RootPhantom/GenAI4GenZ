const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5500);
const ROOT_DIR = __dirname;
const CHAT_RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const CHAT_RATE_LIMIT_MAX_REQUESTS = Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 30);
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const chatRateLimitStore = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

const parseEnvLine = (line) => {
  const cleaned = line.trim();
  if (!cleaned || cleaned.startsWith("#")) return null;
  const idx = cleaned.indexOf("=");
  if (idx <= 0) return null;
  const key = cleaned.slice(0, idx).trim();
  let value = cleaned.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
};

const loadEnvFile = (fileName) => {
  const fullPath = path.join(ROOT_DIR, fileName);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const parsed = parseEnvLine(line);
    if (!parsed) return;
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  });
};

loadEnvFile(".env.anurag");

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
};

const isRateLimited = (req) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const record = chatRateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    chatRateLimitStore.set(ip, { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS });
    return { limited: false, remaining: CHAT_RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    return { limited: true, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  chatRateLimitStore.set(ip, record);
  return { limited: false, remaining: CHAT_RATE_LIMIT_MAX_REQUESTS - record.count, resetAt: record.resetAt };
};

const isOriginAllowed = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(String(origin).trim());
};

const pruneRateLimitStore = () => {
  const now = Date.now();
  for (const [ip, record] of chatRateLimitStore.entries()) {
    if (!record || now > record.resetAt) {
      chatRateLimitStore.delete(ip);
    }
  }
};

const getRequestBody = (req, limit = 1_000_000) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const extractResponseText = (apiResponse) => {
  if (typeof apiResponse?.output_text === "string" && apiResponse.output_text.trim()) {
    return apiResponse.output_text.trim();
  }

  const parts = Array.isArray(apiResponse?.output) ? apiResponse.output : [];
  const text = parts
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .filter((content) => content?.type === "output_text" && typeof content?.text === "string")
    .map((content) => content.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return text;
};

const buildContextText = (context) => {
  if (!context || typeof context !== "object") return "";

  const lines = [
    `Health score: ${context.finalScore ?? "N/A"}`,
    `Risk level: ${context.risk ?? "N/A"}`,
    `Risk flags: ${Array.isArray(context.flags) && context.flags.length ? context.flags.join(", ") : "none"}`,
    `Conditions: ${Array.isArray(context.conditions) && context.conditions.length ? context.conditions.join(", ") : "none"}`,
    `Doctor review: ${context.doctorReview ?? "N/A"}`,
    `Summary: ${context.summary ?? "N/A"}`
  ];

  return lines.join("\n");
};

const buildPrompt = (question, contextText) =>
  [
    "You are a friendly health chatbot for an educational app.",
    "Greet naturally when user says hello.",
    "Use provided context when available, but you can still answer general wellness questions without it.",
    "Never claim diagnosis and never present treatment as guaranteed.",
    "For symptom questions (e.g., fever, cough, headache), provide practical relief steps, hydration/rest guidance, and monitoring tips.",
    "Always include red-flag escalation advice (seek urgent care for severe symptoms like persistent high fever, chest pain, breathing trouble, fainting, confusion).",
    "Keep response concise and easy to follow.",
    "",
    `Context:\n${contextText}`,
    "",
    `Question: ${question}`
  ].join("\n");

const callOpenAi = async (question, contextText) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a friendly health chatbot for an educational app. Greet naturally. Use provided context when available. Never claim diagnosis. For symptom questions provide practical relief guidance and include red-flag urgent-care signs. Keep answers concise and safe."
        },
        {
          role: "user",
          content: `Context:\n${contextText}\n\nQuestion: ${question}`
        }
      ]
    })
  });

  const data = await openAiResponse.json();
  if (!openAiResponse.ok) {
    const message = data?.error?.message || "OpenAI API request failed.";
    throw new Error(message);
  }

  const reply = extractResponseText(data) || "I could not generate a response right now. Please try again.";
  return { reply, provider: "openai" };
};

const callGemini = async (question, contextText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const prompt = buildPrompt(question, contextText);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400
        }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Gemini API request failed.";
    throw new Error(message);
  }

  const reply = (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => String(part?.text || "").trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return {
    reply: reply || "I could not generate a response right now. Please try again.",
    provider: "gemini"
  };
};

const handleChatApi = async (req, res) => {
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  if (!hasOpenAi && !hasGemini) {
    sendJson(res, 500, { error: "No AI provider key found. Set OPENAI_API_KEY or GEMINI_API_KEY." });
    return;
  }

  try {
    const rawBody = await getRequestBody(req);
    const body = JSON.parse(rawBody || "{}");
    const question = String(body?.question || "").trim();
    if (!question) {
      sendJson(res, 400, { error: "Question is required." });
      return;
    }

    const contextText = buildContextText(body?.context || {});
    const errors = [];

    if (hasOpenAi) {
      try {
        const result = await callOpenAi(question, contextText);
        if (result) {
          sendJson(res, 200, result);
          return;
        }
      } catch (error) {
        errors.push(`OpenAI: ${error.message}`);
      }
    }

    if (hasGemini) {
      try {
        const result = await callGemini(question, contextText);
        if (result) {
          sendJson(res, 200, result);
          return;
        }
      } catch (error) {
        errors.push(`Gemini: ${error.message}`);
      }
    }

    sendJson(res, 502, {
      error: "AI provider request failed.",
      details: errors
    });
  } catch (error) {
    sendJson(res, 500, { error: "Server error while generating chat response." });
  }
};

const serveStaticFile = (req, res) => {
  const rawPath = decodeURIComponent(req.url.split("?")[0]);
  const safePath = rawPath === "/" ? "/index.html" : rawPath;
  const filePath = path.join(ROOT_DIR, safePath);
  const normalized = path.normalize(filePath);

  if (!normalized.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(normalized, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(normalized).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(normalized).pipe(res);
  });
};

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") {
    if (!isOriginAllowed(req)) {
      sendJson(res, 403, { error: "Origin not allowed." });
      return;
    }

    const rateState = isRateLimited(req);
    if (rateState.limited) {
      res.setHeader("Retry-After", String(Math.ceil((rateState.resetAt - Date.now()) / 1000)));
      sendJson(res, 429, {
        error: "Too many chat requests. Please wait and try again.",
        resetAt: rateState.resetAt
      });
      return;
    }
    await handleChatApi(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStaticFile(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Health Monitoring Agent server running on http://localhost:${PORT}`);
});

setInterval(pruneRateLimitStore, 60 * 1000).unref();
