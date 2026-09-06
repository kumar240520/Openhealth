const reportService = require('./src/services/reports/reportService');
const { supabaseAdmin } = require('./src/config/supabase');

async function runTest() {
  console.log('--- Starting Reports Backend Integration Test ---');

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

  console.log(`[Test 1] Testing getReportsDashboardData for Patient 1 (${patient1.user_id})...`);
  const dashboardData = await reportService.getReportsDashboardData(patient1.user_id);
  console.log(`✓ Uploaded reports count: ${dashboardData.uploadedReports?.length}`);
  console.log(`✓ Test reports count: ${dashboardData.testReports?.length}`);
  console.log(`✓ Timeline events count: ${dashboardData.timeline?.length}`);

  if (dashboardData.uploadedReports?.length === 0) {
    console.error('Expected at least 1 seeded uploaded report.');
    process.exit(1);
  }

  const firstReport = dashboardData.uploadedReports[0];
  console.log(`  First uploaded report: ${firstReport.report_title} (${firstReport.category_tag}) - ${firstReport.hospital?.name}`);

  // 2. Test getTimeline
  console.log('[Test 2] Testing getTimeline...');
  const timeline = await reportService.getTimeline(patient1.user_id);
  console.log(`✓ Fetched ${timeline.length} timeline events.`);
  console.log(`  Latest event: ${timeline[0]?.event_title} (${timeline[0]?.event_date})`);

  // 3. Test getTestReports
  console.log('[Test 3] Testing getTestReports...');
  const tests = await reportService.getTestReports(patient1.user_id);
  console.log(`✓ Fetched ${tests.length} test reports.`);
  console.log(`  First test: ${tests[0]?.test_name} - ${tests[0]?.status}`);

  // 4. Test User Isolation if Patient 2 exists
  if (patient2) {
    console.log(`[Test 4] Testing User Isolation (Patient 2 querying dashboard)...`);
    const p2Data = await reportService.getReportsDashboardData(patient2.user_id);
    console.log(`✓ Patient 2 has independent uploaded reports count: ${p2Data.uploadedReports?.length}`);
    // Verify Patient 2 doesn't share patient_id with Patient 1's records
    const p1RecordBelongingToP2 = p2Data.uploadedReports.some(r => r.patient_id === patient1.id);
    if (p1RecordBelongingToP2) {
      console.error('FAILED: Cross-patient data leak detected!');
      process.exit(1);
    }
    console.log('✓ PASS: Zero cross-patient records leaked. Strict Rule 30 isolation verified.');
  }

  console.log('--- All Reports Backend Tests Passed Successfully! ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
