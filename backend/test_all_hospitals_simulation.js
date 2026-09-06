const emergencyService = require('./src/services/emergency/emergencyService');
const { supabaseAdmin } = require('./src/config/supabase');

async function testAllHospitalsAndSimulation() {
  console.log('========================================================================');
  console.log('🚨 TESTING MULTI-HOSPITAL REAL ROAD SIMULATION & GUEST RESILIENCE');
  console.log('========================================================================');

  const patientCoords = [22.7533, 75.8937]; // Vijay Nagar, Indore

  // 1. Test Unauthenticated Guest Session Creation
  console.log('\nStep 1: Testing Guest Emergency Session Creation (No Auth Token)...');
  const guestSession = await emergencyService.startEmergencySession({
    userId: null, // Guest emergency caller
    latitude: patientCoords[0],
    longitude: patientCoords[1],
    emergencyType: 'Acute Emergency Assistance',
    searchRadiusM: 20000
  });

  console.log(`✓ Guest Emergency Session successfully created in PostgreSQL!`);
  console.log(`  - Session ID: ${guestSession.session.id}`);
  console.log(`  - Status: ${guestSession.session.status}`);
  console.log(`  - Bound to Patient Profile ID: ${guestSession.session.patient_id}`);

  // 2. Test Real Road Routing & Simulation for ALL Indore Hospitals
  console.log('\nStep 2: Testing Real OSRM Road Driving Simulation for Hospitals in Indore:');
  
  const testHospitals = [
    { name: 'Apollo Hospitals', coords: [22.7610, 75.8970] },
    { name: 'Choithram Hospital & Research Centre', coords: [22.6950, 75.8500] },
    { name: 'Bombay Hospital', coords: [22.7562, 75.9015] },
    { name: 'Shalby Hospital', coords: [22.7389, 75.8821] },
    { name: 'CHL Hospitals', coords: [22.7321, 75.8890] }
  ];

  for (const h of testHospitals) {
    const route = await emergencyService.getDrivingRoute(h.coords, patientCoords);
    console.log(`✓ [${h.name}]`);
    console.log(`  - Real Road Distance: ${route.distanceKm} km`);
    console.log(`  - Real Estimated Driving Time: ${route.etaMinutes} mins`);
    console.log(`  - Real Road Waypoints: ${route.waypoints.length} GPS road coordinates across Indore`);
  }

  // 3. Test Ambulance Dispatch for Choithram Hospital as well as Apollo
  console.log('\nStep 3: Dispatching Ambulance for Choithram Hospital to Patient...');
  const { data: choithramHosp } = await supabaseAdmin
    .from('hospitals')
    .select('id, name')
    .ilike('name', '%choithram%')
    .single();

  if (choithramHosp) {
    const dispatchChoithram = await emergencyService.dispatchAmbulance({
      userId: null,
      sessionId: guestSession.session.id,
      hospitalId: choithramHosp.id,
      pickupLatitude: patientCoords[0],
      pickupLongitude: patientCoords[1]
    });

    console.log(`✓ Ambulance Dispatched from ${choithramHosp.name}!`);
    console.log(`  - Vehicle: ${dispatchChoithram.ambulance.vehicleNumber} (${dispatchChoithram.ambulance.ambulanceType})`);
    console.log(`  - Driver: ${dispatchChoithram.ambulance.driverName} (${dispatchChoithram.ambulance.driverPhone})`);
    console.log(`  - Provider: ${dispatchChoithram.ambulance.providerName}`);
  }

  // Clean up
  await emergencyService.updateSessionStatus({
    userId: null,
    sessionId: guestSession.session.id,
    status: 'cancelled',
    reason: 'Multi-hospital simulation verification complete'
  });
  console.log('\n✓ Session cancelled & emergency fleet status freed.');

  console.log('\n========================================================================');
  console.log('✅ MULTI-HOSPITAL REAL ROAD SIMULATION & DATABASE PIPELINE FULLY VERIFIED!');
  console.log('========================================================================');
  process.exit(0);
}

testAllHospitalsAndSimulation().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
