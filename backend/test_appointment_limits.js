const { supabaseAdmin } = require('./src/config/supabase');
const bookingService = require('./src/services/bookings/bookingService');

async function runAppointmentLimitsTest() {
  console.log('🧪 Starting Doctor Appointment Daily Limits & Uniqueness Invariant Test...\n');

  const testUserId = 'a3333333-3333-3333-3333-333333333333';
  const testDate = '2099-11-20'; // Dedicated test date far in the future

  try {
    // 1. Fetch 3 distinct active doctors
    const { data: doctors, error: docErr } = await supabaseAdmin
      .from('doctors')
      .select('id, name')
      .eq('is_active', true)
      .limit(3);

    if (docErr || !doctors || doctors.length < 3) {
      throw new Error('Need at least 3 active doctors in DB to run test.');
    }

    const [doc1, doc2, doc3] = doctors;
    console.log(`👨‍⚕️ Test Doctors:`);
    console.log(`   Doctor 1: ${doc1.name} (${doc1.id})`);
    console.log(`   Doctor 2: ${doc2.name} (${doc2.id})`);
    console.log(`   Doctor 3: ${doc3.name} (${doc3.id})`);

    // Clean up any pre-existing records on test date
    await supabaseAdmin
      .from('doctor_appointments')
      .delete()
      .eq('appointment_date', testDate);

    // TEST 1: Initial daily slots query
    console.log('\n--- Test 1: Check initial daily slots on empty date ---');
    const initialSlots = await bookingService.getPatientDailySlots({
      userId: testUserId,
      appointmentDate: testDate,
      doctorId: doc1.id
    });
    console.log('Initial slots status:', initialSlots);
    if (initialSlots.activeSlotsCount !== 0 || initialSlots.remainingSlots !== 2 || !initialSlots.canBook) {
      throw new Error(`Test 1 Failed: Expected 0 active slots, got ${initialSlots.activeSlotsCount}`);
    }
    console.log('✅ Test 1 PASSED: 0/2 slots active, canBook = true');

    // TEST 2: Book 1st appointment with Doctor 1
    console.log('\n--- Test 2: Book 1st appointment with Doctor 1 ---');
    const apt1 = await bookingService.createAppointment({
      userId: testUserId,
      doctorId: doc1.id,
      appointmentDate: testDate,
      appointmentTime: '09:00 AM',
      consultationType: 'in_clinic',
      patientNotes: 'Test appointment 1'
    });
    console.log(`✅ Test 2 PASSED: Appointment 1 created (${apt1.appointmentId})`);

    // TEST 3: Attempt 2nd appointment with same Doctor 1 on same date -> MUST FAIL
    console.log('\n--- Test 3: Re-book same Doctor 1 on same date (Should Fail) ---');
    let doc1DuplicateCaught = false;
    try {
      await bookingService.createAppointment({
        userId: testUserId,
        doctorId: doc1.id,
        appointmentDate: testDate,
        appointmentTime: '02:00 PM',
        consultationType: 'video',
        patientNotes: 'Attempted duplicate doctor appointment'
      });
    } catch (err) {
      if (err.message.includes('already have an appointment booked with') || err.message.includes('different doctors')) {
        doc1DuplicateCaught = true;
        console.log(`✅ Test 3 PASSED: Expected error caught: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error on duplicate doctor: ${err.message}`);
      }
    }
    if (!doc1DuplicateCaught) {
      throw new Error('Test 3 Failed: Allowed duplicate doctor booking on the same date!');
    }

    // TEST 4: Book 2nd appointment with different Doctor 2 -> MUST SUCCEED (2/2 active slots)
    console.log('\n--- Test 4: Book 2nd appointment with different Doctor 2 (Should Succeed) ---');
    const apt2 = await bookingService.createAppointment({
      userId: testUserId,
      doctorId: doc2.id,
      appointmentDate: testDate,
      appointmentTime: '11:00 AM',
      consultationType: 'in_clinic',
      patientNotes: 'Test appointment 2'
    });
    console.log(`✅ Test 4 PASSED: Appointment 2 created (${apt2.appointmentId})`);

    // TEST 5: Verify 2/2 slots now active
    console.log('\n--- Test 5: Verify daily slots filled (2/2 active) ---');
    const fullSlots = await bookingService.getPatientDailySlots({
      userId: testUserId,
      appointmentDate: testDate,
      doctorId: doc3.id
    });
    console.log('Filled slots status:', fullSlots);
    if (fullSlots.activeSlotsCount !== 2 || fullSlots.remainingSlots !== 0 || fullSlots.canBook) {
      throw new Error(`Test 5 Failed: Expected 2 active slots, got ${fullSlots.activeSlotsCount}`);
    }
    console.log('✅ Test 5 PASSED: 2/2 slots filled, canBook = false');

    // TEST 6: Attempt 3rd appointment with Doctor 3 -> MUST FAIL (limit reached)
    console.log('\n--- Test 6: Book 3rd appointment with Doctor 3 (Should Fail Daily Limit) ---');
    let limitCaught = false;
    try {
      await bookingService.createAppointment({
        userId: testUserId,
        doctorId: doc3.id,
        appointmentDate: testDate,
        appointmentTime: '04:00 PM',
        consultationType: 'in_clinic',
        patientNotes: 'Attempted 3rd slot'
      });
    } catch (err) {
      if (err.message.includes('Daily appointment limit reached')) {
        limitCaught = true;
        console.log(`✅ Test 6 PASSED: Expected daily limit error caught: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error on daily limit: ${err.message}`);
      }
    }
    if (!limitCaught) {
      throw new Error('Test 6 Failed: Allowed 3rd appointment beyond daily limit of 2!');
    }

    // TEST 7: Cancel Appointment 1 -> Frees up a slot
    console.log('\n--- Test 7: Cancel Appointment 1 to free up a slot ---');
    await bookingService.cancelAppointment(testUserId, apt1.appointmentId, 'Testing slot recycling');
    const slotsAfterCancel = await bookingService.getPatientDailySlots({
      userId: testUserId,
      appointmentDate: testDate,
      doctorId: doc3.id
    });
    console.log('Slots after cancellation:', slotsAfterCancel);
    if (slotsAfterCancel.activeSlotsCount !== 1 || slotsAfterCancel.remainingSlots !== 1 || !slotsAfterCancel.canBook) {
      throw new Error(`Test 7 Failed: Slot was not freed up after cancellation!`);
    }
    console.log('✅ Test 7 PASSED: Active slots dropped to 1/2, slot recycled!');

    // TEST 8: Now booking Doctor 3 should SUCCEED
    console.log('\n--- Test 8: Book Doctor 3 in the recycled slot ---');
    const apt3 = await bookingService.createAppointment({
      userId: testUserId,
      doctorId: doc3.id,
      appointmentDate: testDate,
      appointmentTime: '04:00 PM',
      consultationType: 'in_clinic',
      patientNotes: 'Recycled slot booking'
    });
    console.log(`✅ Test 8 PASSED: Appointment 3 created in recycled slot (${apt3.appointmentId})`);

    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await supabaseAdmin
      .from('doctor_appointments')
      .delete()
      .eq('appointment_date', testDate);
    console.log('🧹 Test data cleaned up.');

    console.log('\n🎉 ALL 8 INVARIANT TEST SUITES PASSED FLAWLESSLY!');
  } catch (e) {
    console.error('\n❌ TEST SUITE FAILED:', e);
    process.exit(1);
  }
}

runAppointmentLimitsTest().then(() => process.exit(0));
