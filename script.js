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

let latest = null;
const REPORT_LOGO_PATH = "assets/anurag-health-card-logo.png";

const addChat = (text, role = "assistant") => {
  const p = document.createElement("p");
  p.textContent = `${role === "user" ? "You" : "Agent"}: ${text}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
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
  if (v.sleepHours < ageProfile.sleepLow) score -= 8;
  if (v.steps < ageProfile.stepsLow) score -= 7;
  if (v.heartRate > ageProfile.heartRateHigh || v.heartRate < ageProfile.heartRateLow) score -= 10;
  if (/poor|junk|irregular/i.test(v.diet)) score -= 6;
  if (/high|severe/i.test(v.stress)) score -= 8;
  return Math.max(0, Math.min(100, score));
};

const flagsFromInput = (v, ageProfile) => {
  const flags = [];
  if (v.heartRate > ageProfile.heartRateHigh + 5 || v.heartRate < ageProfile.heartRateLow) {
    flags.push("Abnormal heart rate");
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

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "S");

  doc.setFillColor(15, 23, 42);
  doc.rect(cardX, cardY, cardW, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("HEALTH MONITORING CERTIFICATE", cardX + 8, cardY + 15);
  doc.setFontSize(9);
  doc.text("AI Health Summary & Risk Evaluation Card", cardX + 8, cardY + 20);

  doc.setFontSize(11);

  let y = cardY + 34;
  const lineGap = 8;
  const drawField = (label, value, valueColor = fieldColor.value) => {
    doc.setTextColor(...fieldColor.label);
    doc.text(`${label}:`, cardX + 8, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setTextColor(...valueColor);
    doc.text(String(value), cardX + 8 + labelWidth, y);
    y += lineGap;
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
  doc.setFontSize(12);
  doc.setTextColor(...fieldColor.heading);
  doc.text("Health Reports", cardX + 8, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(...fieldColor.value);
  const reportLines = doc.splitTextToSize(healthReports, cardW - 16);
  doc.text(reportLines, cardX + 8, y);

  y += Math.min(reportLines.length * 5 + 8, 70);
  doc.setFontSize(12);
  doc.setTextColor(...fieldColor.heading);
  doc.text("Advices", cardX + 8, y);
  y += 6;
  doc.setFontSize(10);
  if (!advices.length) {
    doc.setTextColor(...fieldColor.muted);
    doc.text("- No advice available", cardX + 8, y);
    y += 6;
  } else {
    doc.setTextColor(...fieldColor.positive);
    advices.slice(0, 6).forEach((advice) => {
      const adviceLines = doc.splitTextToSize(`- ${advice}`, cardW - 16);
      doc.text(adviceLines, cardX + 8, y);
      y += adviceLines.length * 5 + 1;
    });
  }

  const footerY = cardY + cardH - 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(cardX + 8, footerY - 6, cardX + cardW - 8, footerY - 6);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Generated by ANURAG SINGH", cardX + 8, footerY);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, cardX + cardW - 62, footerY);

  let watermarkApplied = false;
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

  const safeName = (patientName || "patient").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`health-report-${safeName}.pdf`);
};

healthForm.addEventListener("submit", (e) => {
  e.preventDefault();
  statusEl.textContent = "Analyzing and compressing...";

  const formData = new FormData(healthForm);
  const input = {
    patientName: String(formData.get("patientName") || "Patient"),
    patientAge: Number(formData.get("patientAge") || 30),
    medicalHistory: String(formData.get("medicalHistory") || ""),
    symptoms: String(formData.get("symptoms") || ""),
    medications: String(formData.get("medications") || ""),
    heartRate: Number(formData.get("heartRate") || 0),
    bloodPressure: String(formData.get("bloodPressure") || ""),
    sleepHours: Number(formData.get("sleepHours") || 0),
    steps: Number(formData.get("steps") || 0),
    exercise: String(formData.get("exercise") || ""),
    diet: String(formData.get("diet") || ""),
    stress: String(formData.get("stress") || "")
  };

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

  latest = { summary, risk, flags: combinedRisks, finalScore, compressed };

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

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addChat(text, "user");
  chatInput.value = "";

  if (!latest) {
    addChat("Please submit your health data first so I can answer accurately.");
    return;
  }

  const q = text.toLowerCase();
  if (q.includes("how is my health")) {
    addChat(`Health score ${latest.finalScore}/100, risk ${latest.risk}. Flags: ${latest.flags.join(", ") || "none"}.`);
  } else if (q.includes("summarize") || q.includes("medical history")) {
    addChat(latest.summary);
  } else {
    addChat("Focus on sleep consistency, stress control, and regular activity based on your latest profile.");
  }
});

downloadReportBtn?.addEventListener("click", downloadPdfReport);

addChat("Hello! I am your health assistant. Submit your health data to begin.");
updateHealthCondition(Number(healthScoreEl.textContent || 72));
