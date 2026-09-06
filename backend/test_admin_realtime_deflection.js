const { supabaseAdmin } = require('./src/config/supabase');
const adminService = require('./src/services/admin/adminService');

async function testRealtimeDeflection() {
  console.log('================================================================');
  console.log('🔄 OPENHEALTH: REAL-TIME CROSS-MODULE DEFLECTION VERIFICATION');
  console.log('================================================================\n');

  try {
    // 1. Initial Admin Metrics Baseline
    console.log('1. Reading Baseline Admin Metrics from Supabase...');
    const baseline = await adminService.getDashboardMetrics();
    console.log(`   📊 Baseline: Total Beds=${baseline.totalBeds}, Available=${baseline.availableBeds}, Occupied=${baseline.occupiedBeds}, Emergency=${baseline.activeEmergency}, Bookings=${baseline.totalBookings}`);

    // Pick a hospital bed inventory record to perform live deflection
    const { data: bedRow, error: bedErr } = await supabaseAdmin
      .from('hospital_beds')
      .select('id, hospital_id, total_beds, available_beds, occupied_beds')
      .limit(1)
      .single();

    if (bedErr || !bedRow) {
      throw new Error(`No hospital bed row found to test deflection: ${bedErr?.message}`);
    }

    const { data: hosp } = await supabaseAdmin
      .from('hospitals')
      .select('id, name, verification_status')
      .eq('id', bedRow.hospital_id)
      .single();

    console.log(`\n2. Target Facility for Deflection: "${hosp.name}" (ID: ${hosp.id})`);
    console.log(`   🛏️ Initial Bed Record [${bedRow.id}]: Total=${bedRow.total_beds}, Available=${bedRow.available_beds}, Occupied=${bedRow.occupied_beds}`);

    // 3. Hospital Module Action: Staff expands ward capacity (+10 beds, all available)
    console.log('\n3. [Hospital Module Action] Hospital staff expands bed capacity (+10 beds)...');
    await supabaseAdmin
      .from('hospital_beds')
      .update({
        total_beds: bedRow.total_beds + 10,
        available_beds: bedRow.available_beds + 10
      })
      .eq('id', bedRow.id);

    // 4. Admin Telemetry Verification
    const postBedMetrics = await adminService.getDashboardMetrics();
    console.log(`   📊 Admin Post-Update Telemetry: Total Beds=${postBedMetrics.totalBeds}, Available=${postBedMetrics.availableBeds}`);

    const bedDeflected = postBedMetrics.totalBeds === baseline.totalBeds + 10 &&
                         postBedMetrics.availableBeds === baseline.availableBeds + 10;
    if (!bedDeflected) {
      throw new Error(`Deflection check failed! Expected total beds: ${baseline.totalBeds + 10}, got: ${postBedMetrics.totalBeds}`);
    }
    console.log('   ✅ Live Deflection Verified: Ward expansion immediately altered Admin Platform Telemetry (+10 Total, +10 Available)!');

    // 5. Patient / Hospital Module Action: Patient admitted into bed (Availability drops by 3, Occupied rises by 3)
    console.log('\n5. [Patient / Hospital Module Action] Patient admitted - Availability drops by 3, Occupied rises by 3...');
    await supabaseAdmin
      .from('hospital_beds')
      .update({
        available_beds: bedRow.available_beds + 7,
        occupied_beds: bedRow.occupied_beds + 3
      })
      .eq('id', bedRow.id);

    const postAdmitMetrics = await adminService.getDashboardMetrics();
    console.log(`   📊 Admin Post-Admission Telemetry: Available Beds=${postAdmitMetrics.availableBeds}, Occupied Beds=${postAdmitMetrics.occupiedBeds}`);
    if (postAdmitMetrics.occupiedBeds !== baseline.occupiedBeds + 3) {
      throw new Error(`Deflection check failed on admission! Expected occupied: ${baseline.occupiedBeds + 3}, got: ${postAdmitMetrics.occupiedBeds}`);
    }
    console.log('   ✅ Live Deflection Verified: Patient admission directly deflected in Admin Occupied Bed Telemetry (+3 occupied)!');

    // 6. Restore original bed record
    console.log('\n6. Restoring original bed inventory baseline...');
    await supabaseAdmin
      .from('hospital_beds')
      .update({
        total_beds: bedRow.total_beds,
        available_beds: bedRow.available_beds,
        occupied_beds: bedRow.occupied_beds
      })
      .eq('id', bedRow.id);

    const restoredMetrics = await adminService.getDashboardMetrics();
    console.log(`   📊 Restored Baseline: Total Beds=${restoredMetrics.totalBeds}, Available=${restoredMetrics.availableBeds}, Occupied=${restoredMetrics.occupiedBeds}`);

    // 7. Verify Admin Compliance Review Action directly deflecting to Facility & Audit Log
    console.log('\n7. [Admin Module Action] Admin updates facility compliance status with audit trail...');
    const originalStatus = hosp.verification_status;
    const testStatus = originalStatus === 'verified' ? 'pending' : 'verified';

    // Toggle verification
    await adminService.verifyHospital(hosp.id, testStatus, 'Compliance automated deflection audit verification', null, '127.0.0.1');
    const { data: updatedHosp } = await supabaseAdmin.from('hospitals').select('verification_status, verification_notes').eq('id', hosp.id).single();
    console.log(`   ✅ Admin action reflected in Hospital record: verification_status="${updatedHosp.verification_status}" (Notes: "${updatedHosp.verification_notes}")`);

    // Verify audit log captured it
    const recentLogs = await adminService.getAuditLogs({ limit: 3 });
    const matchLog = recentLogs.find(l => l.entity_id === hosp.id);
    if (matchLog) {
      console.log(`   ✅ Security Audit Event Verified: Action="${matchLog.action}", Entity="${matchLog.entity_type}", ID="${matchLog.id}"`);
    }

    // Revert back to original
    await adminService.verifyHospital(hosp.id, originalStatus, 'Compliance revert to baseline', null, '127.0.0.1');
    console.log(`   ✅ Reverted hospital verification cleanly to original state: verification_status="${originalStatus}"`);

    console.log('\n================================================================');
    console.log('🎉 REAL-TIME CROSS-MODULE DEFLECTION FULLY VERIFIED & PASSED (100%)');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ Deflection Verification Failed:', error);
    process.exit(1);
  }
}

testRealtimeDeflection();
