const billService = require('./src/services/bills/billService');
const { supabaseAdmin } = require('./src/config/supabase');

async function runTest() {
  console.log('--- Starting Bills Backend Integration Test ---');

  // 1. Get a test patient
  const { data: profiles, error: pErr } = await supabaseAdmin
    .from('patient_profiles')
    .select('id, user_id')
    .limit(2);

  if (pErr || !profiles || profiles.length === 0) {
    console.error('No patient profiles found to test with.');
    process.exit(1);
  }

  const patient1 = profiles[0];
  const patient2 = profiles[1] || null;

  console.log(`[Test 1] Testing getPatientBills for Patient 1 (${patient1.user_id})...`);
  const bills = await billService.getPatientBills(patient1.user_id);
  console.log(`✓ Fetched ${bills.length} bills.`);

  if (bills.length === 0) {
    console.error('Expected at least 1 seeded comparison bill.');
    process.exit(1);
  }

  const firstBill = bills[0];
  console.log(`  First bill: ${firstBill.hospital?.name || 'Hospital'} | ${firstBill.treatment_name} | ${firstBill.final_amount} INR`);
  console.log(`  Line items count: ${firstBill.line_items?.length || 0}`);

  // 2. Test getBillById
  console.log(`[Test 2] Testing getBillById for Bill ID ${firstBill.id}...`);
  const billDetail = await billService.getBillById(patient1.user_id, firstBill.id);
  console.log(`✓ Retrieved bill details: ${billDetail.treatment_name}, Package: ${billDetail.package?.name || 'None'}`);

  // 3. Test submitHospitalRating
  console.log('[Test 3] Testing submitHospitalRating...');
  const ratingRes = await billService.submitHospitalRating({
    userId: patient1.user_id,
    hospitalId: firstBill.hospital_id,
    billId: firstBill.id,
    rating: 5,
    feedback: 'Excellent transparent billing and care experience!'
  });
  console.log(`✓ Rating recorded with ID: ${ratingRes.id}, Rating: ${ratingRes.rating} stars`);

  // Clean up test rating
  await supabaseAdmin.from('hospital_reviews').delete().eq('id', ratingRes.id);

  // 4. Test User Isolation if Patient 2 exists
  if (patient2) {
    console.log(`[Test 4] Testing User Isolation (Patient 2 attempting to query Patient 1 bill)...`);
    try {
      await billService.getBillById(patient2.user_id, firstBill.id);
      console.error('FAILED: Patient 2 was able to retrieve Patient 1 bill!');
      process.exit(1);
    } catch (err) {
      console.log(`✓ PASS: Unauthorized access blocked with error: "${err.message}" (status: ${err.status})`);
    }
  }

  console.log('--- All Bills Backend Tests Passed Successfully! ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
