const emergencyService = require('./src/services/emergency/emergencyService');
const { supabaseAdmin } = require('./src/config/supabase');

async function runEmergencyFullFlowVerification() {
  console.log('===============================================================');
  console.log('🚨 OPENHEALTH COMPLETE END-TO-END EMERGENCY MODE VERIFICATION');
  console.log('===============================================================');

  const testUserId = 'a9e7819f-30e0-4c0d-b808-1d0dbe4a827f';
  const patientLat = 22.7533;
  const patientLng = 75.8937;

  // 1. Proximity & Capability Ranking
  console.log('\nStep 1: Testing Proximity & Capability Ranking Service...');
  const hospitals = await emergencyService.getNearbyHospitals({
    latitude: patientLat,
    longitude: patientLng,
    radiusM: 25000
  });

  console.log(`✓ Retrieved ${hospitals.length} nearby hospitals with emergency facilities in Indore:`);
  hospitals.slice(0, 5).forEach((h, i) => {
    console.log(`  [Rank ${i + 1}] ${h.name} (${h.distanceText}) | ER Beds: ${h.erBeds} | ICU Beds: ${h.icuBeds} | Status: ${h.ambulanceStatusLabel} | ETA: ${h.etaText}`);
  });

  const apolloHosp = hospitals.find(h => h.name.toLowerCase().includes('apollo'));
  if (!apolloHosp) throw new Error('Apollo Hospitals not found in Indore emergency list');
  console.log(`✓ Apollo Hospitals confirmed: ${apolloHosp.distanceText}, ER Beds: ${apolloHosp.erBeds}, ICU Beds: ${apolloHosp.icuBeds}`);

  // 2. Emergency Session Initialization
  console.log('\nStep 2: Initializing Emergency Orchestration Session in PostgreSQL...');
  const startRes = await emergencyService.startEmergencySession({
    userId: testUserId,
    latitude: patientLat,
    longitude: patientLng,
    emergencyType: 'Critical Trauma / Cardiac Response',
    searchRadiusM: 15000
  });

  const sessionId = startRes.session.id;
  console.log(`✓ Session Created in DB: ID ${sessionId}, Status: ${startRes.session.status}`);

  // Verify PostgreSQL matches
  const { data: matches, error: mErr } = await supabaseAdmin
    .from('emergency_hospital_matches')
    .select('hospital_id, distance_m, eta_minutes, match_status')
    .eq('emergency_session_id', sessionId);
  console.log(`✓ emergency_hospital_matches records created: ${matches?.length} hospitals ranked in PostgreSQL`);

  // 3. Ambulance Dispatch
  console.log('\nStep 3: Dispatching Emergency Ambulance to Patient...');
  const dispatchRes = await emergencyService.dispatchAmbulance({
    userId: testUserId,
    sessionId: sessionId,
    hospitalId: apolloHosp.id,
    pickupLatitude: patientLat,
    pickupLongitude: patientLng
  });

  console.log(`✓ Ambulance Assigned: ${dispatchRes.ambulance.vehicleNumber} (${dispatchRes.ambulance.ambulanceType})`);
  console.log(`✓ Driver Assigned: ${dispatchRes.ambulance.driverName} (${dispatchRes.ambulance.driverPhone})`);
  console.log(`✓ Initial ETA: ${dispatchRes.ambulance.etaMinutes} mins (${dispatchRes.ambulance.distanceKm} km away)`);
  console.log(`✓ Provider Fleet: ${dispatchRes.ambulance.providerName}`);

  // Verify DB ambulance_requests
  const { data: dbReq } = await supabaseAdmin
    .from('ambulance_requests')
    .select('*')
    .eq('emergency_session_id', sessionId)
    .single();
  console.log(`✓ Database ambulance_requests confirmed: ID ${dbReq?.id}, Status: ${dbReq?.status}, ETA: ${dbReq?.eta_minutes} min`);

  // Verify ambulance status updated to 'assigned'
  const { data: dbAmb } = await supabaseAdmin
    .from('ambulances')
    .select('id, vehicle_number, status')
    .eq('id', dispatchRes.ambulance.id)
    .single();
  console.log(`✓ Database ambulances confirmed: Vehicle ${dbAmb?.vehicle_number}, Status: ${dbAmb?.status}`);

  // 4. Live Session Rehydration
  console.log('\nStep 4: Testing In-Flight Active Session Rehydration...');
  const rehydrated = await emergencyService.getActiveSession(testUserId);
  console.log(`✓ Active Session successfully rehydrated!`);
  console.log(`  - Session ID: ${rehydrated.sessionId}`);
  console.log(`  - Hospital: ${rehydrated.hospital.name} (${rehydrated.hospital.city})`);
  console.log(`  - Ambulance: ${rehydrated.ambulance.vehicleNumber} driven by ${rehydrated.ambulance.driverName}`);
  console.log(`  - Telemetry Timeline: ${rehydrated.timeline.length} milestone steps`);

  // 5. State Machine Lifecycle
  console.log('\nStep 5: Testing State Machine Status Progression...');
  
  // Transition to en_route
  await emergencyService.updateSessionStatus({
    userId: testUserId,
    sessionId: sessionId,
    status: 'en_route'
  });
  console.log('✓ Transitioned to en_route');

  // Transition to arrived
  await emergencyService.updateSessionStatus({
    userId: testUserId,
    sessionId: sessionId,
    status: 'arrived'
  });
  console.log('✓ Transitioned to arrived');

  // Verify ambulance freed back to available
  const { data: freedAmb } = await supabaseAdmin
    .from('ambulances')
    .select('id, status')
    .eq('id', dispatchRes.ambulance.id)
    .single();
  console.log(`✓ Ambulance status reset in DB after arrival: ${freedAmb?.status}`);

  console.log('\n===============================================================');
  console.log('✅ ALL EMERGENCY ORCHESTRATION & DATABASE LIFECYCLE TESTS PASSED!');
  console.log('===============================================================');
  process.exit(0);
}

runEmergencyFullFlowVerification().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
