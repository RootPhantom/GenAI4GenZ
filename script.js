const healthForm = document.getElementById("healthForm");
const summaryText = document.getElementById("summaryText");
const compressedPayload = document.getElementById("compressedPayload");
const recommendationList = document.getElementById("recommendationList");
const healthScoreEl = document.getElementById("healthScore");
const riskFlagsEl = document.getElementById("riskFlags");
const riskBadge = document.getElementById("riskBadge");
const healthConditionRing = document.getElementById("healthConditionRing");
const healthConditionPercent = document.getElementById("healthConditionPercent");
const healthConditionLabel = document.getElementById("healthConditionLabel");
const dashboardSection = document.getElementById("dashboard");
const reportCardSection = document.getElementById("report-card");
const reportPatientName = document.getElementById("reportPatientName");
const reportPatientAge = document.getElementById("reportPatientAge");
const reportHealthLevel = document.getElementById("reportHealthLevel");
const reportHealthScore = document.getElementById("reportHealthScore");
const reportHealthBadge = document.getElementById("reportHealthBadge");
const reportRisks = document.getElementById("reportRisks");
const reportConditions = document.getElementById("reportConditions");
const reportDoctorReview = document.getElementById("reportDoctorReview");
const reportHealthReports = document.getElementById("reportHealthReports");
const reportAdvices = document.getElementById("reportAdvices");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const statusEl = document.getElementById("formStatus");
const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatFab = document.getElementById("chatFab");
const chatWidget = document.getElementById("chatWidget");
const chatWidgetLog = document.getElementById("chatWidgetLog");
const chatWidgetForm = document.getElementById("chatWidgetForm");
const chatWidgetInput = document.getElementById("chatWidgetInput");
const chatWidgetClose = document.getElementById("chatWidgetClose");
const chatWidgetClear = document.getElementById("chatWidgetClear");
const sidebarProfileName = document.getElementById("sidebarProfileName");
const sidebarHistoryList = document.getElementById("sidebarHistoryList");

let latest = null;
const REPORT_LOGO_PATH = "assets/anurag-health-card-logo.png";
const healthHistoryEntries = [];
const HISTORY_MAX_ENTRIES = 8;
const SIDEBAR_HISTORY_STORAGE_KEY = "health-sidebar-history";
const SIDEBAR_HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let sidebarHistoryCreatedAt = null;

const sanitizeText = (value, maxLength) => String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);

const getHistoryPayload = (input, risk, finalScore) =>
  `${input.patientName || "Patient"}: Risk ${risk}, Score ${finalScore}, History ${input.medicalHistory.slice(0, 90)}`;

const renderSidebarHistory = () => {
  if (!sidebarHistoryList) return;

  sidebarHistoryList.innerHTML = "";

  if (!healthHistoryEntries.length) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "No health history yet.";
    sidebarHistoryList.appendChild(emptyLi);
    return;
  }

  healthHistoryEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    sidebarHistoryList.appendChild(li);
  });
};

const saveSidebarHistory = (profileName) => {
  try {
    const createdAt = sidebarHistoryCreatedAt || Date.now();
    sidebarHistoryCreatedAt = createdAt;

    const payload = {
      profileName,
      entries: healthHistoryEntries,
      createdAt,
      expiresAt: createdAt + SIDEBAR_HISTORY_TTL_MS
    };
    window.localStorage.setItem(SIDEBAR_HISTORY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
  }
};

const loadSidebarHistory = () => {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_HISTORY_STORAGE_KEY);
    if (!raw) {
      renderSidebarHistory();
      return;
    }

    const payload = JSON.parse(raw);
    if (!payload || Number(payload.expiresAt) < Date.now()) {
      window.localStorage.removeItem(SIDEBAR_HISTORY_STORAGE_KEY);
      sidebarHistoryCreatedAt = null;
      renderSidebarHistory();
      return;
    }

    sidebarHistoryCreatedAt = Number(payload.createdAt) || Date.now();

    if (sidebarProfileName && payload.profileName) {
      sidebarProfileName.textContent = String(payload.profileName);
    }

    const restoredEntries = Array.isArray(payload.entries) ? payload.entries.slice(0, HISTORY_MAX_ENTRIES) : [];
    healthHistoryEntries.splice(0, healthHistoryEntries.length, ...restoredEntries);
    renderSidebarHistory();
  } catch {
    sidebarHistoryCreatedAt = null;
    renderSidebarHistory();
  }
};

const updateSidebarProfile = (input, risk, finalScore) => {
  const profileName = input.patientName || "Not provided";

  if (sidebarProfileName) {
    sidebarProfileName.textContent = profileName;
  }

  if (!sidebarHistoryList) return;

  const historyPayload = getHistoryPayload(input, risk, finalScore);
  const historyText = `${new Date().toLocaleDateString()} - ${historyPayload}`;

  const topEntry = healthHistoryEntries[0] || "";
  const topEntryPayload = String(topEntry).replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*/i, "").toLowerCase();
  const normalizedPayload = historyPayload.toLowerCase();

  if (topEntryPayload === normalizedPayload) {
    renderSidebarHistory();
    saveSidebarHistory(profileName);
    return;
  }

  healthHistoryEntries.unshift(historyText);
  if (healthHistoryEntries.length > HISTORY_MAX_ENTRIES) {
    healthHistoryEntries.length = HISTORY_MAX_ENTRIES;
  }

  renderSidebarHistory();
  saveSidebarHistory(profileName);
};

loadSidebarHistory();

const addChat = (text, role = "assistant") => {
  const p = document.createElement("p");
  p.textContent = `${role === "user" ? "You" : "Agent"}: ${text}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;

  if (chatWidgetLog) {
    const widgetLine = document.createElement("p");
    widgetLine.textContent = p.textContent;
    chatWidgetLog.appendChild(widgetLine);
    chatWidgetLog.scrollTop = chatWidgetLog.scrollHeight;
  }
};

const getAgeProfile = (ageValue) => {
  const age = Math.max(1, Math.min(120, Number(ageValue) || 30));

  if (age >= 60) {
    return {
      label: `Senior (${age})`,
      heartRateHigh: 100,
      heartRateLow: 50,
      sleepLow: 6.5,
      stepsLow: 5500,
      bpHighSys: 145,
      bpHighDia: 92,
      bpUrgentSys: 165,
      bpUrgentDia: 102
    };
  }

  return {
    label: `Adult (${age})`,
    heartRateHigh: 95,
    heartRateLow: 55,
    sleepLow: 7,
    stepsLow: 7000,
    bpHighSys: 140,
    bpHighDia: 90,
    bpUrgentSys: 160,
    bpUrgentDia: 100
  };
};

const scoreFromInput = (v, ageProfile) => {
  let score = 85;
  const { systolic, diastolic } = parseBloodPressure(v.bloodPressure);

  if (v.sleepHours < ageProfile.sleepLow) score -= 8;
  if (v.steps < ageProfile.stepsLow) score -= 7;
  if (v.heartRate > ageProfile.heartRateHigh || v.heartRate < ageProfile.heartRateLow) score -= 10;
  if ((systolic && systolic >= ageProfile.bpHighSys) || (diastolic && diastolic >= ageProfile.bpHighDia)) score -= 10;
  if ((systolic && systolic >= ageProfile.bpUrgentSys) || (diastolic && diastolic >= ageProfile.bpUrgentDia)) score -= 6;
  if ((systolic && systolic < 95) || (diastolic && diastolic < 60)) score -= 4;
  if (/poor|junk|irregular/i.test(v.diet)) score -= 6;
  if (/high|severe/i.test(v.stress)) score -= 8;
  return Math.max(0, Math.min(100, score));
};

const flagsFromInput = (v, ageProfile) => {
  const flags = [];
  const { systolic, diastolic } = parseBloodPressure(v.bloodPressure);

  if (v.heartRate > ageProfile.heartRateHigh + 5 || v.heartRate < ageProfile.heartRateLow) {
    flags.push("Abnormal heart rate");
  }
  if ((systolic && systolic >= ageProfile.bpHighSys) || (diastolic && diastolic >= ageProfile.bpHighDia)) {
    flags.push("Elevated blood pressure");
  }
  if ((systolic && systolic >= ageProfile.bpUrgentSys) || (diastolic && diastolic >= ageProfile.bpUrgentDia)) {
    flags.push("Critical blood pressure");
  }
  if ((systolic && systolic < 95) || (diastolic && diastolic < 60)) {
    flags.push("Low blood pressure");
  }
  if (v.sleepHours < 6) flags.push("Sleep deficit");
  if (v.steps < 4000) flags.push("Low activity");
  if (/high|severe/i.test(v.stress)) flags.push("High stress");
  if (/pain|breath|chest|dizziness/i.test(v.symptoms)) flags.push("Critical symptom keywords");
  return flags;
};

const parseBloodPressure = (bpText) => {
  const match = String(bpText || "").match(/(\d{2,3})\s*[\/-]\s*(\d{2,3})/);
  if (!match) return { systolic: null, diastolic: null };
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
};

const isValidBloodPressure = (bpText) => {
  const { systolic, diastolic } = parseBloodPressure(bpText);
  if (!systolic || !diastolic) return false;
  if (systolic < 70 || systolic > 260) return false;
  if (diastolic < 40 || diastolic > 160) return false;
  if (systolic <= diastolic) return false;
  return true;
};

const areVitalsReasonable = (input) => {
  if (input.heartRate < 30 || input.heartRate > 220) return false;
  if (input.sleepHours < 0 || input.sleepHours > 24) return false;
  if (input.steps < 0 || input.steps > 100000) return false;
  return true;
};

const detectClinicalPatterns = (input, ageProfile) => {
  const conditions = [];
  const symptomsText = `${input.symptoms} ${input.medicalHistory}`.toLowerCase();
  const { systolic, diastolic } = parseBloodPressure(input.bloodPressure);

  const pushCondition = (label, severity, advice) => {
    if (!conditions.some((c) => c.label === label)) {
      conditions.push({ label, severity, advice });
    }
  };

  if ((systolic && systolic >= ageProfile.bpHighSys) || (diastolic && diastolic >= ageProfile.bpHighDia)) {
    pushCondition("Hypertension Risk", 3, "Monitor BP twice daily and consult physician for BP management.");
  }

  if ((systolic && systolic < 95) || (diastolic && diastolic < 60)) {
    pushCondition("Hypotension Risk", 2, "Increase hydration and seek medical review if dizziness persists.");
  }

  if (input.heartRate > 110 || /chest|palpitation|dizziness/.test(symptomsText)) {
    pushCondition("Cardiac Stress Pattern", 3, "Prioritize urgent cardiac evaluation if chest symptoms continue.");
  }

  if (/breath|wheez|asthma|cough/.test(symptomsText)) {
    pushCondition("Respiratory Concern", 2, "Track oxygen/respiratory symptoms and consult pulmonology if worsening.");
  }

  if (/diabet|insulin|sugar/.test(symptomsText)) {
    pushCondition("Glycemic/Diabetes Concern", 2, "Maintain glucose tracking and dietary carbohydrate control.");
  }

  if (input.steps < 4000 && /poor|junk|irregular/.test(input.diet.toLowerCase())) {
    pushCondition("Metabolic Lifestyle Risk", 2, "Increase daily movement and improve meal quality for metabolic health.");
  }

  if (input.sleepHours < 5.5 && /high|severe/.test(input.stress.toLowerCase())) {
    pushCondition("Burnout / Recovery Deficit", 2, "Stabilize sleep routine and add stress-recovery breaks daily.");
  }

  return conditions;
};

const getDoctorReviewUrgency = (input, conditions, ageProfile) => {
  const severeCondition = conditions.some((condition) => condition.severity >= 3);
  const symptomCritical = /chest pain|shortness of breath|severe dizziness|faint|blackout/i.test(input.symptoms);
  const hrCritical = input.heartRate >= 120 || input.heartRate <= 45;
  const { systolic, diastolic } = parseBloodPressure(input.bloodPressure);
  const bpCritical =
    (systolic && systolic >= ageProfile.bpUrgentSys) ||
    (diastolic && diastolic >= ageProfile.bpUrgentDia);

  if (symptomCritical || hrCritical || bpCritical) {
    return "Urgent doctor review recommended (within 24h)";
  }

  if (severeCondition) {
    return "Doctor review recommended soon";
  }

  if (conditions.length) {
    return "Routine doctor review suggested";
  }

  return "No immediate doctor review needed";
};

const getHealthBadge = (score) => {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  if (safeScore < 40) {
    return { label: "🔴 Critical Care", className: "badge-critical" };
  }
  if (safeScore < 60) {
    return { label: "🟠 Recovery Mode", className: "badge-low" };
  }
  if (safeScore < 75) {
    return { label: "🟡 Health Tracker", className: "badge-mid" };
  }
  if (safeScore < 90) {
    return { label: "🟢 Wellness Star", className: "badge-good" };
  }

  return { label: "🔵 Health Champion", className: "badge-elite" };
};

const updateHealthCondition = (score) => {
  const normalized = Math.max(0, Math.min(100, Number(score) || 0));

  let state = "mid";
  let label = "Mid";

  if (normalized < 50) {
    state = "low";
    label = "Low";
  } else if (normalized >= 80) {
    state = "excellent";
    label = "Excellent";
  }

  healthConditionRing.style.setProperty("--progress", normalized);
  healthConditionRing.classList.remove("low", "mid", "excellent");
  healthConditionRing.classList.add(state);

  healthConditionPercent.textContent = `${normalized}%`;
  healthConditionLabel.textContent = label;
  healthConditionLabel.classList.remove("low", "mid", "excellent");
  healthConditionLabel.classList.add(state);

  return { state, label, normalized };
};

const updateReportCard = ({ patientName, patientAgeLabel, input, summary, finalScore, healthLabel, healthBadge, risks, conditions, doctorReview, recs }) => {
  reportPatientName.textContent = patientName;
  reportPatientAge.textContent = patientAgeLabel;
  reportHealthLevel.textContent = healthLabel;
  reportHealthScore.textContent = `${finalScore}%`;
  reportHealthBadge.textContent = healthBadge.label;
  reportHealthBadge.classList.remove("badge-critical", "badge-low", "badge-mid", "badge-good", "badge-elite");
  reportHealthBadge.classList.add(healthBadge.className);
  reportRisks.textContent = risks.length ? risks.join(", ") : "No major risk flags";
  reportConditions.textContent = conditions.length
    ? conditions.map((condition) => condition.label).join(", ")
    : "No specific condition pattern detected";
  reportDoctorReview.textContent = doctorReview;

  reportHealthReports.textContent =
    `Medical History: ${input.medicalHistory} | Symptoms: ${input.symptoms} | Medications: ${input.medications} | ` +
    `Vitals: HR ${input.heartRate}, BP ${input.bloodPressure}, Sleep ${input.sleepHours}h, Steps ${input.steps} | ` +
    `Detected Conditions: ${conditions.map((condition) => condition.label).join(", ") || "None"} | ` +
    `Summary: ${summary}`;

  reportAdvices.innerHTML = "";
  recs.forEach((advice) => {
    const li = document.createElement("li");
    li.textContent = advice;
    reportAdvices.appendChild(li);
  });
};

const loadLogoAsDataUrl = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => reject(new Error("Logo load failed"));
    img.src = src;
  });

const downloadPdfReport = async () => {
  const jsPdfApi = window.jspdf;
  if (!jsPdfApi?.jsPDF) {
    alert("PDF library not loaded. Please refresh and try again.");
    return;
  }

  const { jsPDF } = jsPdfApi;
  const doc = new jsPDF();

  const patientName = reportPatientName.textContent || "-";
  const patientAge = reportPatientAge.textContent || "-";
  const healthLevel = reportHealthLevel.textContent || "-";
  const healthScore = reportHealthScore.textContent || "-";
  const healthBadge = reportHealthBadge.textContent || "-";
  const risks = reportRisks.textContent || "-";
  const conditions = reportConditions.textContent || "-";
  const doctorReview = reportDoctorReview.textContent || "-";
  const healthReports = reportHealthReports.textContent || "-";
  const advices = Array.from(reportAdvices.querySelectorAll("li")).map((li) => li.textContent || "");

  const fieldColor = {
    label: [30, 64, 175],
    value: [15, 23, 42],
    heading: [37, 99, 235],
    positive: [4, 120, 87],
    warning: [180, 83, 9],
    danger: [185, 28, 28],
    muted: [71, 85, 105]
  };

  const pageWidth = 210;
  const pageHeight = 297;
  const cardX = 10;
  const cardY = 12;
  const cardW = pageWidth - 20;
  const cardH = pageHeight - 24;
  const contentStartY = cardY + 34;

  const drawPageHeader = (isContinuation = false) => {
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.2);
    doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "S");

    doc.setFillColor(15, 23, 42);
    const inset = 0.6;
    const headerHeight = 24;
    const headerRadius = 3.2;
    doc.roundedRect(cardX + inset, cardY + inset, cardW - inset * 2, headerHeight, headerRadius, headerRadius, "F");
    doc.rect(cardX + inset, cardY + 12, cardW - inset * 2, headerHeight - 12 + inset, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("HEALTH MONITORING CERTIFICATE", cardX + 8, cardY + 15);
    doc.setFontSize(9);
    doc.text(
      isContinuation ? "AI Health Summary & Risk Evaluation Card (Continued)" : "AI Health Summary & Risk Evaluation Card",
      cardX + 8,
      cardY + 20
    );
  };

  drawPageHeader(false);

  doc.setFontSize(11);

  let y = contentStartY;
  const lineGap = 8;
  const lineHeight = 5;
  const contentBottom = pageHeight - 24;
  const footerBottomPadding = 16;
  const ensureSpace = (neededHeight = lineHeight) => {
    if (y + neededHeight <= contentBottom) return;
    doc.addPage();
    drawPageHeader(true);
    y = contentStartY;
  };

  const drawField = (label, value, valueColor = fieldColor.value) => {
    const rightLimit = cardX + cardW - 8;
    const labelText = `${label}:`;

    doc.setTextColor(...fieldColor.label);
    doc.text(labelText, cardX + 8, y);

    const labelWidth = doc.getTextWidth(`${label}: `);
    const minValueStartX = cardX + 58;
    const valueX = Math.max(cardX + 8 + labelWidth, minValueStartX);
    const valueText = String(value);
    const valueMaxWidth = rightLimit - valueX;

    const valueLines = valueMaxWidth > 30
      ? doc.splitTextToSize(valueText, valueMaxWidth)
      : doc.splitTextToSize(valueText, cardW - 16);

    const textBlockHeight = Math.max(lineGap, valueLines.length * lineHeight + 2);
    ensureSpace(textBlockHeight);

    doc.setTextColor(...valueColor);
    if (valueMaxWidth > 30) {
      doc.text(valueLines, valueX, y);
    } else {
      const stackedY = y + lineHeight;
      doc.text(valueLines, cardX + 8, stackedY);
    }

    y += textBlockHeight;
  };

  const riskColor = /high|urgent|critical/i.test(risks)
    ? fieldColor.danger
    : /medium|moderate/i.test(risks)
      ? fieldColor.warning
      : fieldColor.positive;

  const doctorReviewColor = /urgent/i.test(doctorReview)
    ? fieldColor.danger
    : /soon|routine/i.test(doctorReview)
      ? fieldColor.warning
      : fieldColor.positive;

  drawField("Patient Name", patientName);
  drawField("Age Profile", patientAge);
  drawField("Health Level", healthLevel);
  drawField("Health Score", healthScore, fieldColor.heading);
  drawField("Health Badge", healthBadge, fieldColor.heading);
  drawField("Risks", risks, riskColor);
  drawField("Detected Conditions", conditions, fieldColor.muted);
  drawField("Doctor Review", doctorReview, doctorReviewColor);

  y += 8;
  ensureSpace(12);
  doc.setFontSize(12);
  doc.setTextColor(...fieldColor.heading);
  doc.text("Health Reports", cardX + 8, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(...fieldColor.value);
  const reportLines = doc.splitTextToSize(healthReports, cardW - 16);
  reportLines.forEach((line) => {
    ensureSpace(lineHeight + 1);
    doc.text(line, cardX + 8, y);
    y += lineHeight;
  });

  y += 8;
  ensureSpace(12);
  doc.setFontSize(12);
  doc.setTextColor(...fieldColor.heading);
  doc.text("Advices", cardX + 8, y);
  y += 6;
  doc.setFontSize(10);
  if (!advices.length) {
    doc.setTextColor(...fieldColor.muted);
    ensureSpace(lineHeight + 1);
    doc.text("- No advice available", cardX + 8, y);
    y += 6;
  } else {
    doc.setTextColor(...fieldColor.positive);
    advices.slice(0, 6).forEach((advice) => {
      const adviceLines = doc.splitTextToSize(`- ${advice}`, cardW - 16);
      adviceLines.forEach((line) => {
        ensureSpace(lineHeight + 1);
        doc.text(line, cardX + 8, y);
        y += lineHeight;
      });
      y += 1;
    });
  }

  let watermarkApplied = false;
  doc.setPage(1);
  try {
    const logoAsset = await loadLogoAsDataUrl(REPORT_LOGO_PATH);

    const wmMaxW = cardW - 56;
    const wmMaxH = cardH - 92;
    const wmScale = Math.min(wmMaxW / logoAsset.width, wmMaxH / logoAsset.height);
    const wmW = Math.max(80, logoAsset.width * wmScale);
    const wmH = Math.max(80, logoAsset.height * wmScale);
    const wmX = cardX + (cardW - wmW) / 2;
    const wmY = cardY + (cardH - wmH) / 2 + 8;

    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.addImage(logoAsset.dataUrl, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");
    doc.restoreGraphicsState();
    watermarkApplied = true;

    const maxLogoW = 48;
    const maxLogoH = 20;
    const logoScale = Math.min(maxLogoW / logoAsset.width, maxLogoH / logoAsset.height);
    const logoW = Math.max(12, logoAsset.width * logoScale);
    const logoH = Math.max(8, logoAsset.height * logoScale);
    const logoX = cardX + cardW - logoW - 7;
    const logoY = cardY + 2;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX - 2, logoY - 1, logoW + 4, logoH + 2, 2, 2, "F");
    doc.addImage(logoAsset.dataUrl, "PNG", logoX, logoY, logoW, logoH, undefined, "FAST");
  } catch {
    const sealX = cardX + cardW - 20;
    const sealY = cardY + 12;
    doc.setFillColor(37, 99, 235);
    doc.circle(sealX, sealY, 8, "F");
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.8);
    doc.circle(sealX, sealY, 8, "S");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("AS", sealX - 2.5, sealY + 2);
  }

  if (!watermarkApplied) {
    doc.saveGraphicsState();
    doc.setTextColor(214, 228, 245);
    doc.setFontSize(34);
    doc.text("ANURAG SINGH", cardX + 24, cardY + 150, { angle: 28 });
    doc.restoreGraphicsState();
  }

  const footerY = pageHeight - footerBottomPadding;
  const generatedOn = new Date().toLocaleDateString();
  const totalPages = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(18, footerY - 6, pageWidth - 18, footerY - 6);
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Generated by ANURAG SINGH", 18, footerY);
    doc.text(`Generated on: ${generatedOn}`, pageWidth - 18, footerY, { align: "right" });
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
  }

  const safeName = (patientName || "patient").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`health-report-${safeName}.pdf`);
};

healthForm.addEventListener("submit", (e) => {
  e.preventDefault();
  statusEl.textContent = "Analyzing and compressing...";

  const formData = new FormData(healthForm);
  const input = {
    patientName: sanitizeText(formData.get("patientName"), 80) || "Patient",
    patientAge: Number(formData.get("patientAge") || 30),
    medicalHistory: sanitizeText(formData.get("medicalHistory"), 1200),
    symptoms: sanitizeText(formData.get("symptoms"), 800),
    medications: sanitizeText(formData.get("medications"), 500),
    heartRate: Number(formData.get("heartRate") || 0),
    bloodPressure: sanitizeText(formData.get("bloodPressure"), 20),
    sleepHours: Number(formData.get("sleepHours") || 0),
    steps: Number(formData.get("steps") || 0),
    exercise: sanitizeText(formData.get("exercise"), 300),
    diet: sanitizeText(formData.get("diet"), 300),
    stress: sanitizeText(formData.get("stress"), 80)
  };

  if (!isValidBloodPressure(input.bloodPressure)) {
    statusEl.textContent = "Please enter a valid blood pressure in SYS/DIA format (example: 120/80).";
    return;
  }

  if (!areVitalsReasonable(input)) {
    statusEl.textContent = "Please check vitals values (heart rate, sleep hours, steps) and submit again.";
    return;
  }

  const ageProfile = getAgeProfile(input.patientAge);

  const flags = flagsFromInput(input, ageProfile);
  const conditions = detectClinicalPatterns(input, ageProfile);
  const conditionFlags = conditions.map((condition) => condition.label);
  const combinedRisks = [...new Set([...flags, ...conditionFlags])];
  const score = scoreFromInput(input, ageProfile) - flags.length * 3;
  const finalScore = Math.max(0, score);
  const risk = finalScore < 50 || combinedRisks.length >= 4 ? "High" : finalScore < 75 ? "Medium" : "Low";
  const doctorReview = getDoctorReviewUrgency(input, conditions, ageProfile);

  const summary = `History: ${input.medicalHistory.slice(0, 120)} | Symptoms: ${input.symptoms.slice(0, 90)} | Vitals: HR ${input.heartRate}, BP ${input.bloodPressure}, Sleep ${input.sleepHours}h, Steps ${input.steps}`;

  const compressed = btoa(
    JSON.stringify({
      summary,
      risk,
      flags: combinedRisks,
      healthScore: finalScore
    })
  );

  summaryText.textContent = summary;
  compressedPayload.textContent = compressed;
  healthScoreEl.textContent = String(finalScore);
  const healthBadge = getHealthBadge(finalScore);
  const { label: healthLabel } = updateHealthCondition(finalScore);
  riskFlagsEl.textContent = combinedRisks.length ? combinedRisks.join(", ") : "No flags";
  riskBadge.textContent = `Risk: ${risk}`;
  riskBadge.classList.remove("low", "medium", "high");
  riskBadge.classList.add(risk.toLowerCase());

  const recs = [];
  if (input.sleepHours < 7) recs.push("Improve sleep schedule and reduce screen time before bed.");
  if (input.steps < 8000) recs.push("Increase daily steps with 2 short walks.");
  if (/high|severe/i.test(input.stress)) recs.push("Do 10 minutes of breathing/meditation twice daily.");
  if (/poor|junk|irregular/i.test(input.diet)) recs.push("Add fiber and protein to breakfast; reduce processed snacks.");
  conditions.forEach((condition) => recs.push(condition.advice));
  if (!recs.length) recs.push("Maintain your current routine and keep tracking.");
  const finalRecs = [...new Set(recs)];

  latest = {
    summary,
    risk,
    flags: combinedRisks,
    finalScore,
    compressed,
    conditions,
    doctorReview,
    recs: finalRecs,
    input,
    ageProfile
  };

  updateSidebarProfile(input, risk, finalScore);

  recommendationList.innerHTML = "";
  finalRecs.forEach((rec) => {
    const li = document.createElement("li");
    li.textContent = rec;
    recommendationList.appendChild(li);
  });

  updateReportCard({
    patientName: input.patientName,
    patientAgeLabel: ageProfile.label,
    input,
    summary,
    finalScore,
    healthLabel,
    healthBadge,
    risks: combinedRisks,
    conditions,
    doctorReview,
    recs: finalRecs
  });

  statusEl.textContent = "Done. Summary and recommendations updated.";
  addChat("Your health data is processed. Ask me: 'How is my health?'");

  reportCardSection?.scrollIntoView({ behavior: "smooth", block: "start" });
});

const respondToChat = (text) => {
  if (!latest) {
    addChat("Please submit your health data first so I can answer accurately.");
    return;
  }

  const sendWithConfidence = (message, confidence = "Medium") => {
    addChat(`${message} (Confidence: ${confidence})`);
  };

  const getDataQualityConfidence = () => {
    const hasVitals =
      Number(latest.input?.heartRate) > 0 &&
      Number(latest.input?.sleepHours) > 0 &&
      Number(latest.input?.steps) > 0 &&
      /\d{2,3}\s*[\/-]\s*\d{2,3}/.test(String(latest.input?.bloodPressure || ""));
    return hasVitals ? "High" : "Medium";
  };

  const normalize = (value) => String(value || "").toLowerCase();
  const q = normalize(text);

  const hasAny = (patterns) => patterns.some((pattern) => pattern.test(q));
  const formatList = (items, emptyText = "none") => (items && items.length ? items.join(", ") : emptyText);

  const intents = {
    health: hasAny([/how.*health/, /overall/, /status/]),
    risk: hasAny([/risk/, /danger/, /critical/, /safe/]),
    flags: hasAny([/flag/, /warning/, /problem/, /issue/]),
    summary: hasAny([/summar/, /overview/, /history/, /report/]),
    doctor: hasAny([/doctor/, /consult/, /review/, /hospital/, /urgent/]),
    recommendation: hasAny([/recommend/, /advice/, /suggest/, /improve/, /better/]),
    vitals: hasAny([/heart rate/, /bp/, /blood pressure/, /sleep/, /steps/, /vitals/]),
    conditions: hasAny([/detected condition/, /\bcondition\b/, /diagnos/, /pattern/]),
    greeting: hasAny([/hello/, /hi\b/, /hey/, /good morning/, /good evening/])
  };

  if (intents.greeting) {
    sendWithConfidence("Hello! Ask me about risk, score, recommendations, vitals, conditions, or doctor review.", "High");
    return;
  }

  if (intents.health) {
    sendWithConfidence(`Current health score is ${latest.finalScore}/100 with ${latest.risk} risk profile.`, getDataQualityConfidence());
    return;
  }

  if (intents.risk) {
    sendWithConfidence(`Risk level is ${latest.risk}. Active risks: ${formatList(latest.flags)}.`, getDataQualityConfidence());
    return;
  }

  if (intents.flags) {
    sendWithConfidence(`Risk flags detected: ${formatList(latest.flags)}.`, getDataQualityConfidence());
    return;
  }

  if (intents.conditions) {
    const conditionLabels = (latest.conditions || []).map((condition) => condition.label);
    sendWithConfidence(
      `Detected conditions: ${formatList(conditionLabels, "no specific condition pattern")}.`,
      conditionLabels.length ? "High" : "Medium"
    );
    return;
  }

  if (intents.doctor) {
    sendWithConfidence(`Doctor review guidance: ${latest.doctorReview}.`, getDataQualityConfidence());
    return;
  }

  if (intents.recommendation) {
    sendWithConfidence(
      `Top recommendations: ${formatList((latest.recs || []).slice(0, 3), "maintain your current routine")}.`,
      (latest.recs || []).length ? "High" : "Medium"
    );
    return;
  }

  if (intents.vitals) {
    const vitalsText = `Vitals are HR ${latest.input.heartRate}, BP ${latest.input.bloodPressure}, Sleep ${latest.input.sleepHours}h, Steps ${latest.input.steps}.`;
    sendWithConfidence(vitalsText, getDataQualityConfidence());
    return;
  }

  if (intents.summary) {
    sendWithConfidence(latest.summary, "High");
    return;
  }

  sendWithConfidence("I can answer about health score, risk, flags, conditions, vitals, doctor review, or recommendations. Ask one of these.", "Medium");
};

const askServerChat = async (question) => {
  const context = latest
    ? {
        summary: latest.summary,
        risk: latest.risk,
        finalScore: latest.finalScore,
        flags: latest.flags,
        conditions: (latest.conditions || []).map((condition) => condition.label),
        doctorReview: latest.doctorReview
      }
    : {
        summary: "No patient submission yet",
        risk: "Unknown",
        finalScore: "N/A",
        flags: [],
        conditions: [],
        doctorReview: "N/A"
      };

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        context
      })
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const reply = String(payload?.reply || "").trim();
    return reply || null;
  } catch {
    return null;
  }
};

const handleChatSubmit = (inputEl) => (e) => {
  e.preventDefault();
  const text = inputEl?.value.trim();
  if (!text) return;
  addChat(text, "user");
  inputEl.value = "";

  (async () => {
    const apiReply = await askServerChat(text);
    if (apiReply) {
      addChat(apiReply);
      return;
    }
    respondToChat(text);
  })();
};

chatForm.addEventListener("submit", handleChatSubmit(chatInput));
chatWidgetForm?.addEventListener("submit", handleChatSubmit(chatWidgetInput));

downloadReportBtn?.addEventListener("click", downloadPdfReport);

chatFab?.addEventListener("click", () => {
  if (!chatWidget) return;
  const shouldOpen = !chatWidget.classList.contains("open");
  chatWidget.classList.toggle("open", shouldOpen);
  if (shouldOpen) {
    setTimeout(() => chatWidgetInput?.focus(), 100);
  }
});

chatWidgetClose?.addEventListener("click", () => {
  chatWidget?.classList.remove("open");
});

chatWidgetClear?.addEventListener("click", () => {
  if (chatLog) chatLog.innerHTML = "";
  if (chatWidgetLog) chatWidgetLog.innerHTML = "";
  resetChatWidgetFirstOpen();
  addChat("Hello! I am your health assistant. Submit your health data to begin.");
});

const CHAT_WIDGET_FIRST_OPEN_KEY = "health-chat-widget-first-opened";

const hasOpenedChatWidgetBefore = () => {
  try {
    return window.localStorage.getItem(CHAT_WIDGET_FIRST_OPEN_KEY) === "true";
  } catch {
    return false;
  }
};

const markChatWidgetOpened = () => {
  try {
    window.localStorage.setItem(CHAT_WIDGET_FIRST_OPEN_KEY, "true");
  } catch {
  }
};

const resetChatWidgetFirstOpen = () => {
  try {
    window.localStorage.removeItem(CHAT_WIDGET_FIRST_OPEN_KEY);
  } catch {
  }
};

if (chatWidget && !hasOpenedChatWidgetBefore()) {
  chatWidget.classList.add("open");
  markChatWidgetOpened();
  setTimeout(() => chatWidgetInput?.focus(), 150);
}

addChat("Hello! I am your health assistant. Submit your health data to begin.");
updateHealthCondition(Number(healthScoreEl.textContent || 72));
