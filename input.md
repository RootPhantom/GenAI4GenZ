# Health Monitoring Agent Test Inputs

Use these inputs to quickly test the full static app flow (`index.html` + `script.js`):
- Health score calculation
- Risk flags
- Compressed summary output
- Recommendations
- Chatbot responses

---

## Test Case 1: Moderate Risk (balanced default)

### Form Inputs
- Medical history: `Mild asthma since childhood. Seasonal allergies. No recent hospitalization.`
- Symptoms: `Occasional fatigue and slight headache in evening.`
- Medications: `Montelukast once daily, Vitamin D weekly.`
- Heart rate: `88`
- Blood pressure: `124/82`
- Sleep hours: `6.5`
- Steps: `6200`
- Exercise habits: `Light walk 4 days/week`
- Diet habits: `Mixed diet, sometimes irregular meal times`
- Stress level: `medium`

### Expected Behavior
- Health score should be moderate range
- Risk likely `Medium`
- Recommendations should include sleep/activity improvement

---

## Test Case 2: High Risk

### Form Inputs
- Medical history: `Family history of hypertension and diabetes. Previous episodes of chest discomfort.`
- Symptoms: `Chest pain, dizziness, shortness of breath during exertion.`
- Medications: `None currently`
- Heart rate: `112`
- Blood pressure: `146/95`
- Sleep hours: `4.8`
- Steps: `2200`
- Exercise habits: `No regular exercise`
- Diet habits: `Poor junk food heavy diet`
- Stress level: `high`

### Expected Behavior
- Multiple risk flags should appear
- Health score should drop significantly
- Risk badge should show `High`
- Recommendations should include stress, sleep, activity, and diet improvement

---

## Test Case 3: Low Risk / Healthy Profile

### Form Inputs
- Medical history: `No major illness. Regular annual checkups.`
- Symptoms: `No active symptoms.`
- Medications: `None`
- Heart rate: `72`
- Blood pressure: `118/76`
- Sleep hours: `7.8`
- Steps: `10200`
- Exercise habits: `Cardio + strength 5 days/week`
- Diet habits: `Balanced high protein and fiber`
- Stress level: `low`



