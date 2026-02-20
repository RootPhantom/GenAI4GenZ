const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXCLUDED_DIRS = new Set([".git", "node_modules"]);
const EXCLUDED_FILES = new Set(["package-lock.json"]);

const TEXT_FILE_EXTENSIONS = new Set([
  ".js", ".ts", ".tsx", ".jsx", ".json", ".md", ".html", ".css", ".env", ".anurag", ".txt", ".yml", ".yaml"
]);

const SECRET_PATTERNS = [
  { name: "OpenAI API key", regex: /sk-proj-[A-Za-z0-9_\-]{20,}/g },
  { name: "Google API key", regex: /AIza[0-9A-Za-z\-_]{20,}/g },
  { name: "GitHub token", regex: /ghp_[A-Za-z0-9]{30,}/g },
  { name: "Private key block", regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/g },
  { name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: "Hardcoded OPENAI_API_KEY", regex: /^[ \t]*OPENAI_API_KEY[ \t]*=[ \t]*(?!$|your_real_key_here$)\S.*$/gm },
  { name: "Hardcoded GEMINI_API_KEY", regex: /^[ \t]*GEMINI_API_KEY[ \t]*=[ \t]*(?!$|your_real_key_here$)\S.*$/gm }
];

const ALLOWLIST = [
  {
    pathSuffix: path.join("README.md"),
    regex: /OPENAI_API_KEY=your_real_key_here|GEMINI_API_KEY=your_real_key_here/g
  }
];

const shouldSkip = (filePath) => {
  const relative = path.relative(ROOT, filePath);
  if (!relative || relative.startsWith("..")) return true;

  const segments = relative.split(path.sep);
  if (segments.some((segment) => EXCLUDED_DIRS.has(segment))) return true;
  if (EXCLUDED_FILES.has(path.basename(filePath))) return true;

  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return false;
  return !TEXT_FILE_EXTENSIONS.has(ext);
};

const isAllowlisted = (filePath, matchText) => {
  const relative = path.relative(ROOT, filePath);
  return ALLOWLIST.some((rule) => {
    if (!relative.endsWith(rule.pathSuffix)) return false;
    return rule.regex.test(matchText);
  });
};

const walk = (dirPath, files = []) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath, files);
      continue;
    }
    if (!shouldSkip(fullPath)) files.push(fullPath);
  }
  return files;
};

const findings = [];
for (const filePath of walk(ROOT)) {
  const content = fs.readFileSync(filePath, "utf8");

  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex) || [];
    for (const matchText of matches) {
      if (isAllowlisted(filePath, matchText)) continue;
      findings.push({
        file: path.relative(ROOT, filePath),
        type: pattern.name,
        match: matchText.slice(0, 60)
      });
    }
  }
}

if (findings.length) {
  console.error("❌ Security check failed. Potential secret(s) detected:\n");
  findings.forEach((item) => {
    console.error(`- ${item.type} in ${item.file}: ${item.match}`);
  });
  process.exit(1);
}

console.log("✅ Security check passed. No obvious secrets detected.");
