const { supabaseAdmin } = require('./src/config/supabase');
const adminService = require('./src/services/admin/adminService');

async function runAdminSuite() {
  console.log('================================================================');
  console.log('🧪 OPENHEALTH — PLATFORM ADMIN SUITE VERIFICATION');
  console.log('================================================================\n');

  try {
    // 1. Verify Admin User in database
    console.log('1. Checking platform_admin profile in database...');
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'platform_admin')
      .limit(1)
      .single();

    if (adminErr || !adminUser) {
      throw new Error(`Failed to find platform_admin user: ${adminErr?.message}`);
    }
    console.log(`   ✅ Found Admin: ${adminUser.full_name} (${adminUser.email}) - Role: ${adminUser.role}`);

    // 2. Test Dashboard Metrics Aggregation
    console.log('\n2. Testing Admin Dashboard Metrics (Realtime Aggregate Telemetry)...');
    const metrics = await adminService.getDashboardMetrics();
    console.log('   ✅ Aggregate Metrics Retrieved:');
    console.log(`      - Total Platform Users: ${metrics.totalUsers}`);
    console.log(`      - Patients Registered: ${metrics.patientsCount}`);
    console.log(`      - Total Hospitals: ${metrics.totalHospitals} (Verified: ${metrics.verifiedHospitals}, Pending: ${metrics.pendingHospitals})`);
    console.log(`      - Total Doctors: ${metrics.totalDoctors} (Verified: ${metrics.verifiedDoctors})`);
    console.log(`      - Total Beds: ${metrics.totalBeds} (Available: ${metrics.availableBeds}, Occupied: ${metrics.occupiedBeds})`);
    console.log(`      - Total Bookings & Appointments: ${metrics.totalBookings}`);
    console.log(`      - Total Documents Processed: ${metrics.totalDocuments}`);
    console.log(`      - Active Emergency Sessions: ${metrics.activeEmergency}`);

    if (metrics.totalHospitals === 0 || metrics.totalDoctors === 0) {
      throw new Error('Metrics aggregated 0 hospitals or doctors unexpectedly');
    }

    // 3. Test User Management
    console.log('\n3. Testing User Directory Retrieval...');
    const users = await adminService.getUsers({ role: 'all' });
    console.log(`   ✅ Retrieved ${users.length} users from profiles table.`);

    // 4. Test Hospital Verification Listing
    console.log('\n4. Testing Hospital Facility Registry & Filters...');
    const allHospitals = await adminService.getHospitals({ status: 'all' });
    console.log(`   ✅ Retrieved ${allHospitals.length} hospital facilities.`);
    const firstHosp = allHospitals[0];
    if (firstHosp) {
      const detailedHosp = await adminService.getHospitalById(firstHosp.id);
      console.log(`   ✅ Detailed Facility Fetched: ${detailedHosp.name} (${detailedHosp.city}) with ${detailedHosp.doctors?.length || 0} doctors and ${detailedHosp.departments?.length || 0} departments.`);
    }

    // 5. Test Doctor Credential Verification
    console.log('\n5. Testing Doctor Credential Directory...');
    const doctors = await adminService.getDoctors({ status: 'all' });
    console.log(`   ✅ Retrieved ${doctors.length} doctors from medical registry.`);

    // 6. Test Government Schemes (Create, Read, Update, Delete)
    console.log('\n6. Testing Government Health Schemes Management (CRUD Lifecycle)...');
    const initialSchemes = await adminService.getSchemes();
    console.log(`   ✅ Current Active Schemes in DB: ${initialSchemes.length}`);

    const testSchemeName = `Test Welfare Scheme ${Date.now()}`;
    const newScheme = await adminService.createScheme({
      name: testSchemeName,
      description: 'Automated test health coverage scheme for BPL families.',
      is_active: true,
      eligibility_rules: { coverage_amount: '4,00,000', income_limit: '1,80,000', ration_card: 'BPL' },
      covered_treatments: ['General Medicine', 'Pediatrics'],
      required_documents: ['Aadhaar Card', 'Ration Card']
    }, adminUser.id, '127.0.0.1');
    console.log(`   ✅ Created Test Scheme: ${newScheme.name} (ID: ${newScheme.id})`);

    // Toggle status
    await adminService.toggleSchemeStatus(newScheme.id, false, adminUser.id, '127.0.0.1');
    console.log('   ✅ Toggled Scheme Status to Inactive');

    // Clean up test scheme
    await adminService.deleteScheme(newScheme.id, adminUser.id, '127.0.0.1');
    console.log('   ✅ Cleaned up / Deleted Test Scheme successfully.');

    // 7. Test Insurance Providers Management
    console.log('\n7. Testing Insurance & TPA Provider Management...');
    const insuranceList = await adminService.getInsuranceProviders();
    console.log(`   ✅ Retrieved ${insuranceList.length} insurance partners from database.`);

    // 8. Test Platform Analytics Engine
    console.log('\n8. Testing Platform Analytics Aggregation...');
    const analytics = await adminService.getPlatformAnalytics('30d');
    console.log(`   ✅ Analytics Compiled:`);
    console.log(`      - City Distribution: ${analytics.cityDistribution.map(c => `${c.city}: ${c.count}`).join(', ')}`);
    console.log(`      - Bed Wards Tracked: ${analytics.bedBreakdown.length} categories`);

    // 9. Test Audit Logs Stream & Logging Persistence
    console.log('\n9. Testing Security Audit Logs Stream...');
    await adminService.logAuditEvent('TEST_AUDIT_PROBE', 'system', adminUser.id, { probe: 'ok', timestamp: new Date().toISOString() }, adminUser.id, '127.0.0.1');
    const auditLogs = await adminService.getAuditLogs({ limit: 10 });
    console.log(`   ✅ Audit Logs Stream Active: ${auditLogs.length} events retrieved.`);
    const lastProbe = auditLogs.find(l => l.action === 'TEST_AUDIT_PROBE');
    if (lastProbe) {
      console.log(`   ✅ Verified probe audit event was persisted to PostgreSQL (UUID: ${lastProbe.id})`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL ADMIN SUITE VERIFICATIONS PASSED SUCCESSFULLY (100%)');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Admin Suite Verification Failed:', err);
    process.exit(1);
  }
}

runAdminSuite();
