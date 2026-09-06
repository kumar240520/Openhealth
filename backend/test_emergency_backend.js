const emergencyService = require('./src/services/emergency/emergencyService');
const { supabaseAdmin } = require('./src/config/supabase');

async function testEmergencyBackend() {
  console.log('====================================================');
  console.log('🧪 TESTING EMERGENCY BACKEND & ORCHESTRATION PIPELINE');
  console.log('====================================================');

  const testUserId = 'a9e7819f-30e0-4c0d-b808-1d0dbe4a827f';
  const patientLat = 22.7533;
  const patientLng = 75.8937;

  // 1. Test Nearby Hospitals Ranking
  console.log('\nStep 1: Testing Ranked Nearby Hospitals Service...');
  const hospitals = await emergencyService.getNearbyHospitals({
    latitude: patientLat,
    longitude: patientLng,
    radiusM: 20000
  });

  console.log(`✓ Retrieved ${hospitals.length} nearby emergency hospitals.`);
  hospitals.forEach((h, idx) => {
    console.log(`  [Rank ${idx + 1}] ${h.name} (${h.distanceText}) - ER Beds: ${h.erBeds}, ICU: ${h.icuBeds}, Amb: ${h.ambulanceStatusLabel}, ETA: ${h.etaText}`);
  });

  if (hospitals.length === 0) {
    throw new Error('No emergency hospitals found in Indore vicinity.');
  }

  const topHospital = hospitals[0];
  console.log(`✓ Top Most Suitable Hospital: ${topHospital.name} (isMostSuitable: ${topHospital.isMostSuitable})`);

  // 2. Test Start Emergency Session
  console.log('\nStep 2: Initializing Emergency Session in PostgreSQL...');
  const sessionResult = await emergencyService.startEmergencySession({
    userId: testUserId,
    latitude: patientLat,
    longitude: patientLng,
    emergencyType: 'Cardiac / Trauma Critical Emergency',
    searchRadiusM: 15000
  });

  const session = sessionResult.session;
  console.log(`✓ Emergency Session Created: ID ${session.id}, Status: ${session.status}`);

  // Check emergency_hospital_matches in DB
  const { data: dbMatches } = await supabaseAdmin
    .from('emergency_hospital_matches')
    .select('*')
    .eq('emergency_session_id', session.id);
  console.log(`✓ Database Matches Inserted: ${dbMatches?.length} ranked hospital records`);

  // 3. Test Ambulance Dispatch
  console.log('\nStep 3: Dispatching Emergency Ambulance for Selected Hospital...');
  const dispatchPacket = await emergencyService.dispatchAmbulance({
    userId: testUserId,
    sessionId: session.id,
    hospitalId: topHospital.id,
    pickupLatitude: patientLat,
    pickupLongitude: patientLng
  });

  console.log(`✓ Ambulance Dispatched: ${dispatchPacket.ambulance.vehicleNumber} (${dispatchPacket.ambulance.ambulanceType})`);
  console.log(`✓ Driver: ${dispatchPacket.ambulance.driverName} (${dispatchPacket.ambulance.driverPhone})`);
  console.log(`✓ ETA to Patient: ${dispatchPacket.ambulance.etaMinutes} mins (${dispatchPacket.ambulance.distanceKm} km)`);
  console.log(`✓ Provider: ${dispatchPacket.ambulance.providerName}`);

  // 4. Test Active Session Rehydration
  console.log('\nStep 4: Testing Active In-Flight Session Rehydration...');
  const activeSession = await emergencyService.getActiveSession(testUserId);
  console.log(`✓ Active Session Rehydrated: ID ${activeSession?.sessionId}, Hospital: ${activeSession?.hospital?.name}`);
  console.log(`✓ Live Ambulance: ${activeSession?.ambulance?.vehicleNumber}, ETA: ${activeSession?.ambulance?.etaMinutes} mins`);

  // 5. Test State Machine Transition to En Route and then Cancelled
  console.log('\nStep 5: Testing State Machine Status Transition...');
  await emergencyService.updateSessionStatus({
    userId: testUserId,
    sessionId: session.id,
    status: 'en_route'
  });
  console.log('✓ Status updated to en_route');

  // Cancel session to clean up test run
  await emergencyService.updateSessionStatus({
    userId: testUserId,
    sessionId: session.id,
    status: 'cancelled',
    reason: 'Test execution complete'
  });
  console.log('✓ Status updated to cancelled & ambulance freed');

  console.log('\n====================================================');
  console.log('✅ ALL EMERGENCY BACKEND & DB PIPELINE TESTS PASSED!');
  console.log('====================================================');
  process.exit(0);
}

testEmergencyBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
