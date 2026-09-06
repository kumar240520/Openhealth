const bookingService = require('./src/services/bookings/bookingService');

const PATIENT_1_USER_ID = 'a2222222-2222-2222-2222-222222222222';
const PATIENT_2_USER_ID = 'a3333333-3333-3333-3333-333333333333';

async function runTests() {
  console.log('--- Starting Bookings Backend Integration Tests ---');

  // Test 1: Fetch Patient 1 Bookings
  console.log('[Test 1] Fetching Patient 1 bookings...');
  const data = await bookingService.getPatientBookings(PATIENT_1_USER_ID);
  console.log(`✓ Total Bookings: ${data.totalCount}`);
  console.log(`✓ Tab Counts: All (${data.allCount}), Upcoming (${data.upcomingCount}), Completed (${data.completedCount}), Cancelled (${data.cancelledCount})`);

  if (data.all.length === 0) throw new Error('No bookings returned for Patient 1.');
  
  const b1 = data.all[0];
  console.log('✓ Sample Booking Metadata:', {
    bookingCode: b1.bookingCode,
    hospitalName: b1.hospitalName,
    title: b1.title,
    status: b1.status,
    date: b1.date,
    timeSlot: b1.timeSlot,
    specialization: b1.specialization,
    payableAmount: b1.payableAmount
  });

  // Test 2: Security Isolation (Patient 2 attempting to cancel Patient 1's reservation)
  console.log('[Test 2] Testing Security Isolation (Patient 2 cancelling Patient 1 reservation)...');
  try {
    await bookingService.cancelReservation(PATIENT_2_USER_ID, b1.id, 'Unauthorized test attempt');
    throw new Error('SECURITY VIOLATION: Patient 2 cancelled Patient 1 reservation!');
  } catch (secErr) {
    if (secErr.status === 403 || secErr.status === 404 || secErr.message.includes('Unauthorized') || secErr.message.includes('not found')) {
      console.log('✓ PASS: Unauthorized cross-patient cancellation blocked (status: 403/404).');
    } else {
      throw secErr;
    }
  }

  console.log('--- All Bookings Backend Integration Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
