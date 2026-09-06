const testCases = [
  {
    name: 'Case 1: Neck Pain & Cervical Stiffness',
    symptoms: 'I have severe neck pain and stiffness when turning my head, with pain radiating to shoulder'
  },
  {
    name: 'Case 2: Throbbing Headache & Migraine',
    symptoms: 'Throbbing headache on one side with light sensitivity and chronic dizziness'
  },
  {
    name: 'Case 3: Stomach Pain & Acid Reflux',
    symptoms: 'Severe burning stomach ache after eating with acid reflux, nausea and bloating'
  },
  {
    name: 'Case 4: Skin Rash & Severe Itching',
    symptoms: 'Red itchy skin rash with hives spreading across arms and neck'
  },
  {
    name: 'Case 5: Cardiac Exertional Chest Heaviness',
    symptoms: 'Chest heaviness and breathlessness when climbing stairs with left arm aching'
  }
];

async function runVerification() {
  console.log('====================================================');
  console.log('OPENHEALTH AI SYMPTOM TRIAGE COMPREHENSIVE TEST');
  console.log('====================================================\n');

  for (const tc of testCases) {
    console.log(`[TEST] ${tc.name}`);
    console.log(`Input symptoms: "${tc.symptoms}"`);

    const start = Date.now();
    try {
      const res = await fetch('http://localhost:5000/api/v1/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: tc.symptoms })
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const json = await res.json();

      if (!res.ok || !json.success) {
        console.error(`❌ HTTP ${res.status}:`, json.error || json.message);
        continue;
      }

      const data = json.data;
      console.log(`✓ Status: 200 OK (${elapsed}s)`);
      console.log(`✓ Recommended Specialties: ${JSON.stringify(data.recommended_specialties)}`);
      console.log(`✓ Triage: ${data.triage_level?.toUpperCase()} (Urgency: ${data.triage_urgency_score}/100)`);
      console.log(`✓ Suspected Condition: ${data.suspected_conditions?.[0]?.condition || 'N/A'}`);
      console.log(`✓ Plain Explanation: ${data.plain_explanation}`);
      console.log(`✓ Matched Doctors (${data.matched_doctors?.length || 0}):`);
      data.matched_doctors?.forEach(d => console.log(`   - ${d.name} | ${d.specialization} | ⭐ ${d.rating || 4.5}`));
      console.log(`✓ Matched Hospitals (${data.matched_hospitals?.length || 0}):`);
      data.matched_hospitals?.forEach(h => console.log(`   - ${h.name} (${h.city})`));
      console.log('----------------------------------------------------\n');
    } catch (err) {
      console.error('❌ Request failed:', err.message);
    }
  }
}

runVerification();
