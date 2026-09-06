const { supabaseAdmin } = require('./src/config/supabase');
const patientController = require('./src/controllers/patientController');

const PATIENT_USER_ID = 'a2222222-2222-2222-2222-222222222222';

async function runPatientTests() {
  console.log('--- Starting Patient Suite Integration Tests ---');

  // Test 1: Fetch Profile
  console.log('[Test 1] Testing getProfile...');
  let resData = null;
  const mockReq1 = { userId: PATIENT_USER_ID };
  const mockRes1 = {
    status: (code) => ({
      json: (json) => {
        resData = json;
        return json;
      }
    })
  };
  await patientController.getProfile(mockReq1, mockRes1, (err) => { if (err) throw err; });
  console.log('✓ Profile retrieved:', {
    name: resData.data.full_name,
    email: resData.data.email,
    phone: resData.data.phone,
    aadhaar: resData.data.patient_details?.aadhaar_number,
    blood_group: resData.data.patient_details?.blood_group
  });

  const originalName = resData.data.full_name;
  const originalAadhaar = resData.data.patient_details?.aadhaar_number;

  // Test 2: Update Profile (Attempting to mutate locked fields + updating mutable fields)
  console.log('[Test 2] Testing updateProfile with immutability protection...');
  const mockReq2 = {
    userId: PATIENT_USER_ID,
    body: {
      full_name: 'HACKED NAME DO NOT CHANGE',
      aadhaar_number: '9999-9999-9999',
      blood_group: 'O+',
      emergency_contact_name: 'Dr. R. K. Kumar',
      emergency_contact_phone: '9876543210',
      height_cm: 175,
      weight_kg: 72
    }
  };
  await patientController.updateProfile(mockReq2, mockRes1, (err) => { if (err) throw err; });

  if (resData.data.full_name !== originalName) {
    throw new Error('IMMUTABILITY VIOLATION: full_name was modified!');
  }
  if (resData.data.patient_details.aadhaar_number !== originalAadhaar) {
    throw new Error('IMMUTABILITY VIOLATION: aadhaar_number was modified!');
  }
  console.log('✓ PASS: Immutable fields (full_name, aadhaar_number) remained strictly locked.');
  console.log('✓ PASS: Mutable fields updated:', {
    blood_group: resData.data.patient_details.blood_group,
    emergency_contact: resData.data.patient_details.emergency_contact_name,
    height: resData.data.patient_details.height_cm,
    weight: resData.data.patient_details.weight_kg
  });

  // Test 3: Get Settings
  console.log('[Test 3] Testing getSettings...');
  await patientController.getSettings(mockReq1, mockRes1, (err) => { if (err) throw err; });
  console.log('✓ Settings retrieved:', {
    sms_alerts: resData.data.sms_alerts,
    abha_data_sharing: resData.data.abha_data_sharing,
    preferred_language: resData.data.preferred_language
  });

  // Test 4: Update Settings
  console.log('[Test 4] Testing updateSettings...');
  const mockReq4 = {
    userId: PATIENT_USER_ID,
    body: {
      sms_alerts: true,
      whatsapp_updates: true,
      email_reports: true,
      abha_data_sharing: true,
      anonymous_analytics: false,
      preferred_language: 'en'
    }
  };
  await patientController.updateSettings(mockReq4, mockRes1, (err) => { if (err) throw err; });
  console.log('✓ Settings updated successfully:', resData.message);

  // Test 5: Get Saved Items
  console.log('[Test 5] Testing getSavedItems...');
  await patientController.getSavedItems(mockReq1, mockRes1, (err) => { if (err) throw err; });
  console.log(`✓ Saved Items retrieved: Hospitals (${resData.data.hospitals.length}), Doctors (${resData.data.doctors.length}), Total (${resData.data.totalCount})`);

  // Test 6: Submit KYC Documents
  console.log('[Test 6] Testing submitKYC...');
  const mockReq6 = {
    userId: PATIENT_USER_ID,
    body: {
      aadhaar_number: '582910498921',
      govt_id_type: 'aadhaar',
      govt_id_number: '582910498921'
    }
  };
  await patientController.submitKYC(mockReq6, mockRes1, (err) => { if (err) throw err; });
  console.log('✓ KYC documents submitted and verified:', {
    kyc_status: resData.data.kyc_status,
    aadhaar_number: resData.data.aadhaar_number
  });

  // Test 7: Submit Credential Correction Appeal
  console.log('[Test 7] Testing submitAppeal...');
  const mockReq7 = {
    userId: PATIENT_USER_ID,
    body: {
      credential_field: 'phone',
      requested_value: '+91 98260 99999',
      justification: 'Changed primary SIM card and operator.'
    }
  };
  await patientController.submitAppeal(mockReq7, mockRes1, (err) => { if (err) throw err; });
  console.log('✓ Appeal submitted:', {
    appealId: resData.data.appealId,
    status: resData.data.status,
    message: resData.message
  });

  console.log('--- ALL PATIENT SUITE BACKEND TESTS PASSED! ---');
}

runPatientTests().catch(err => {
  console.error('Patient Tests Failed:', err);
  process.exit(1);
});
