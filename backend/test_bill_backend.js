const billService = require('./src/services/bills/billService');

const PATIENT_1_USER_ID = 'a2222222-2222-2222-2222-222222222222';
const PATIENT_2_USER_ID = 'a3333333-3333-3333-3333-333333333333';

async function runTests() {
  console.log('--- Starting Bill Backend Integration Tests ---');

  // Test 1: Fetch patient bills
  console.log('[Test 1] Fetching Patient 1 bills...');
  const bills = await billService.getPatientBills(PATIENT_1_USER_ID);
  console.log(`✓ Fetched ${bills.length} bills for Patient 1.`);
  if (bills.length === 0) throw new Error('No bills found for Patient 1.');
  const testBill = bills[0];

  // Test 2: Get Available Packages dynamically
  console.log('[Test 2] Testing dynamic package lookup...');
  const packages = await billService.getAvailablePackages(testBill.hospital_id, 'Heart');
  console.log(`✓ Found ${packages.length} packages dynamically matching hospital and treatment.`);

  // Test 3: Get 3-way multi-dimensional comparison
  console.log('[Test 3] Testing getBillComparison (Package, Previous Bills, City Benchmark)...');
  const comparison = await billService.getBillComparison(PATIENT_1_USER_ID, testBill.id);
  console.log('✓ Package Comparison:', {
    name: comparison.packageComparison.packageName,
    price: comparison.packageComparison.packagePrice,
    variance: comparison.packageComparison.varianceAmount,
    variancePct: comparison.packageComparison.variancePercent
  });
  console.log('✓ Previous Bills Comparison:', {
    hasPrior: comparison.previousBillsComparison.hasPriorBills,
    priorCount: comparison.previousBillsComparison.priorCount,
    advisory: comparison.previousBillsComparison.advisory
  });
  console.log('✓ Indore City Benchmark:', {
    city: comparison.cityBenchmark.city,
    avg: comparison.cityBenchmark.averagePrice,
    min: comparison.cityBenchmark.minPrice,
    max: comparison.cityBenchmark.maxPrice,
    hospitalsSampled: comparison.cityBenchmark.hospitalsSampled,
    valueRating: comparison.cityBenchmark.valueRating
  });

  // Test 4: AI Bill Audit
  console.log('[Test 4] Testing AI Bill Audit...');
  const audit = await billService.auditBillWithAI(PATIENT_1_USER_ID, testBill.id);
  console.log('✓ AI Shock Level:', audit.aiFindings.bill_shock_level);
  console.log('✓ Compliance Score:', audit.aiFindings.package_compliance_score);
  console.log('✓ Summary:', audit.aiFindings.audit_summary);

  // Test 5: Multi-user Security Isolation (Patient 2 cannot access Patient 1 bill)
  console.log('[Test 5] Testing Multi-User Security Isolation (Patient 2 accessing Patient 1 bill)...');
  try {
    await billService.getBillComparison(PATIENT_2_USER_ID, testBill.id);
    throw new Error('SECURITY VIOLATION: Patient 2 accessed Patient 1 bill!');
  } catch (secErr) {
    if (secErr.status === 404 || secErr.message.includes('not found') || secErr.message.includes('unauthorized')) {
      console.log('✓ PASS: Unauthorized cross-patient access blocked (status: 404).');
    } else {
      throw secErr;
    }
  }

  console.log('--- All Bill Backend Integration Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
