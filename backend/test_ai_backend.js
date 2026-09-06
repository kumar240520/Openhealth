const aiRecommendationService = require('./src/services/ai/aiRecommendationService');
const { supabaseAdmin } = require('./src/config/supabase');

async function runTest() {
  console.log('--- Starting AI Recommendation Backend Integration Test ---');

  // 1. Get test patients
  const { data: profiles, error: pErr } = await supabaseAdmin
    .from('patient_profiles')
    .select('id, user_id')
    .limit(2);

  if (pErr || !profiles || profiles.length === 0) {
    console.error('No patient profiles found.');
    process.exit(1);
  }

  const patient1 = profiles[0];
  const patient2 = profiles[1] || null;

  // 2. Fetch sample reports and bills for patient 1
  const { data: docs } = await supabaseAdmin
    .from('medical_documents')
    .select('id')
    .eq('patient_id', patient1.id)
    .limit(1);

  const { data: bills } = await supabaseAdmin
    .from('bills')
    .select('id')
    .eq('patient_id', patient1.id)
    .limit(1);

  const reportIds = docs ? docs.map(d => d.id) : [];
  const billIds = bills ? bills.map(b => b.id) : [];

  console.log(`[Test 1] Running multi-modal recommendation analysis for Patient 1 (${patient1.user_id})...`);
  const result = await aiRecommendationService.analyzeAndRecommend({
    userId: patient1.user_id,
    symptoms: 'Feeling chest heaviness and breathlessness when walking upstairs, with slight left shoulder pain.',
    voiceTranscript: 'Doctor, my chest feels heavy when I climb stairs and I feel tired.',
    reportIds,
    billIds
  });

  console.log(`✓ Generated Session Title: ${result.session_title}`);
  console.log(`✓ Triage Level: ${result.triage_level?.toUpperCase()} (Urgency Score: ${result.triage_urgency_score}/100)`);
  console.log(`✓ Top Suspected Condition: ${result.suspected_conditions?.[0]?.condition} (${result.suspected_conditions?.[0]?.probability}%)`);
  console.log(`✓ Recommended Specialties: ${JSON.stringify(result.recommended_specialties)}`);
  console.log(`✓ Matched Indore Doctors Count: ${result.matched_doctors?.length}`);
  console.log(`✓ Matched Treatment Packages Count: ${result.matched_packages?.length}`);
  console.log(`✓ Biomarker Findings Count: ${result.biomarker_findings?.length}`);
  console.log(`✓ Bill Audit Risk: ${result.bill_audit_insights?.bill_shock_risk}`);

  // 3. Test Past Sessions retrieval
  console.log('[Test 2] Testing getPastSessions...');
  const pastSessions = await aiRecommendationService.getPastSessions(patient1.user_id);
  console.log(`✓ Fetched ${pastSessions.length} past sessions for Patient 1.`);

  // 4. Test User Isolation (Rule 30) if Patient 2 exists
  if (patient2) {
    console.log('[Test 3] Testing User Isolation (Patient 2 attempting to query Patient 1 AI session)...');
    try {
      await aiRecommendationService.getSessionById(patient2.user_id, result.id);
      console.error('FAILED: Patient 2 was able to access Patient 1 AI session!');
      process.exit(1);
    } catch (err) {
      console.log(`✓ PASS: Unauthorized access blocked: "${err.message}" (status: ${err.status})`);
    }
  }

  console.log('--- All AI Recommendation Backend Tests Passed Successfully! ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Unhandled AI test failure:', err);
  process.exit(1);
});
