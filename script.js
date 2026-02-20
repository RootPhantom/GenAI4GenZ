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
const reportPatientName = document.getElementById("reportPatientName");
const reportHealthLevel = document.getElementById("reportHealthLevel");
const reportHealthScore = document.getElementById("reportHealthScore");
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

const addChat = (text, role = "assistant") => {
  const p = document.createElement("p");
  p.textContent = `${role === "user" ? "You" : "Agent"}: ${text}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
};

const scoreFromInput = (v) => {
  let score = 85;
  if (v.sleepHours < 7) score -= 8;
  if (v.steps < 7000) score -= 7;
  if (v.heartRate > 95 || v.heartRate < 55) score -= 10;
  if (/poor|junk|irregular/i.test(v.diet)) score -= 6;
  if (/high|severe/i.test(v.stress)) score -= 8;
  return Math.max(0, Math.min(100, score));
};

const flagsFromInput = (v) => {
  const flags = [];
  if (v.heartRate > 100 || v.heartRate < 55) flags.push("Abnormal heart rate");
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

const detectClinicalPatterns = (input) => {
  const conditions = [];
  const symptomsText = `${input.symptoms} ${input.medicalHistory}`.toLowerCase();
  const { systolic, diastolic } = parseBloodPressure(input.bloodPressure);

  const pushCondition = (label, severity, advice) => {
    if (!conditions.some((c) => c.label === label)) {
      conditions.push({ label, severity, advice });
    }
  };

  if ((systolic && systolic >= 140) || (diastolic && diastolic >= 90)) {
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

const getDoctorReviewUrgency = (input, conditions) => {
  const severeCondition = conditions.some((condition) => condition.severity >= 3);
  const symptomCritical = /chest pain|shortness of breath|severe dizziness|faint|blackout/i.test(input.symptoms);
  const hrCritical = input.heartRate >= 120 || input.heartRate <= 45;
  const { systolic, diastolic } = parseBloodPressure(input.bloodPressure);
  const bpCritical = (systolic && systolic >= 160) || (diastolic && diastolic >= 100);

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

const updateReportCard = ({ patientName, input, summary, finalScore, healthLabel, risks, conditions, doctorReview, recs }) => {
  reportPatientName.textContent = patientName;
  reportHealthLevel.textContent = healthLabel;
  reportHealthScore.textContent = `${finalScore}%`;
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

const downloadPdfReport = () => {
  const jsPdfApi = window.jspdf;
  if (!jsPdfApi?.jsPDF) {
    alert("PDF library not loaded. Please refresh and try again.");
    return;
  }

  const { jsPDF } = jsPdfApi;
  const doc = new jsPDF();

  const patientName = reportPatientName.textContent || "-";
  const healthLevel = reportHealthLevel.textContent || "-";
  const healthScore = reportHealthScore.textContent || "-";
  const risks = reportRisks.textContent || "-";
  const conditions = reportConditions.textContent || "-";
  const doctorReview = reportDoctorReview.textContent || "-";
  const healthReports = reportHealthReports.textContent || "-";
  const advices = Array.from(reportAdvices.querySelectorAll("li")).map((li) => li.textContent || "");

  doc.setFontSize(16);
  doc.text("Health Monitoring Agent - Patient Report Card", 14, 16);
  doc.setFontSize(11);
  doc.text(`Patient Name: ${patientName}`, 14, 28);
  doc.text(`Health Level: ${healthLevel}`, 14, 36);
  doc.text(`Health Score: ${healthScore}`, 14, 44);
  doc.text(`Risks: ${risks}`, 14, 52);
  doc.text(`Detected Conditions: ${conditions}`, 14, 60);
  doc.text(`Doctor Review: ${doctorReview}`, 14, 68);

  const reportLines = doc.splitTextToSize(`Health Reports: ${healthReports}`, 180);
  doc.text(reportLines, 14, 80);

  const adviceHeaderY = 80 + reportLines.length * 6 + 6;
  doc.text("Advices:", 14, adviceHeaderY);

  let currentY = adviceHeaderY + 8;
  if (!advices.length) {
    doc.text("- No advice available", 16, currentY);
    currentY += 8;
  } else {
    advices.forEach((advice) => {
      const adviceLines = doc.splitTextToSize(`- ${advice}`, 176);
      doc.text(adviceLines, 16, currentY);
      currentY += adviceLines.length * 6 + 2;
    });
  }

  doc.setFontSize(12);
  doc.text("Generated by ANURAG SINGH", 14, Math.min(currentY + 8, 285));

  const safeName = (patientName || "patient").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`health-report-${safeName}.pdf`);
};

healthForm.addEventListener("submit", (e) => {
  e.preventDefault();
  statusEl.textContent = "Analyzing and compressing...";

  const formData = new FormData(healthForm);
  const input = {
    patientName: String(formData.get("patientName") || "Patient"),
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

  const flags = flagsFromInput(input);
  const conditions = detectClinicalPatterns(input);
  const conditionFlags = conditions.map((condition) => condition.label);
  const combinedRisks = [...new Set([...flags, ...conditionFlags])];
  const score = scoreFromInput(input) - flags.length * 3;
  const finalScore = Math.max(0, score);
  const risk = finalScore < 50 || combinedRisks.length >= 4 ? "High" : finalScore < 75 ? "Medium" : "Low";
  const doctorReview = getDoctorReviewUrgency(input, conditions);

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
    input,
    summary,
    finalScore,
    healthLabel,
    risks: combinedRisks,
    conditions,
    doctorReview,
    recs: finalRecs
  });

  statusEl.textContent = "Done. Summary and recommendations updated.";
  addChat("Your health data is processed. Ask me: 'How is my health?'");

  dashboardSection?.scrollIntoView({ behavior: "smooth", block: "start" });
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
