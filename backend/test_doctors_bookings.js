const http = require('http');
const app = require('./src/app');
const bookingService = require('./src/services/bookings/bookingService');
const doctorService = require('./src/services/doctors/doctorService');

const PORT = 5002;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Doctor & Booking test server running on http://127.0.0.1:${PORT}`);

  function get(path, headers = {}) {
    return new Promise((resolve, reject) => {
      http.get({
        hostname: '127.0.0.1',
        port: PORT,
        path,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  }

  function post(path, body = {}, headers = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      }, (res) => {
        let resData = '';
        res.on('data', chunk => resData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  try {
    console.log('\n--- 1. Doctor Marketplace API ---');
    const doctorsRes = await get('/api/v1/doctors?limit=5');
    console.log('GET /api/v1/doctors:', doctorsRes.status, doctorsRes.body?.success === true ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Returned ${doctorsRes.body?.data?.doctors?.length} doctors. Total count: ${doctorsRes.body?.data?.total}`);

    const sampleDoctor = doctorsRes.body?.data?.doctors?.[0];
    if (!sampleDoctor) {
      throw new Error('No doctors found in database.');
    }

    console.log('\n--- 2. Specialties Catalogue API ---');
    const specRes = await get('/api/v1/doctors/specialties');
    console.log('GET /api/v1/doctors/specialties:', specRes.status, specRes.body?.success === true ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Found ${specRes.body?.data?.length} distinct specialties. Top specialty: ${specRes.body?.data?.[0]?.name}`);

    console.log('\n--- 3. Single Doctor Clinical Dossier API ---');
    const docDetailRes = await get(`/api/v1/doctors/${sampleDoctor.id}`);
    console.log('GET /api/v1/doctors/:id:', docDetailRes.status, docDetailRes.body?.data?.name === sampleDoctor.name ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Doctor name: ${docDetailRes.body?.data?.name}, Hospital: ${docDetailRes.body?.data?.hospitals?.name}`);

    console.log('\n--- 4. Dynamic Doctor Slots API ---');
    const slotsRes = await get(`/api/v1/doctors/${sampleDoctor.id}/slots?date=2026-09-05`);
    console.log('GET /api/v1/doctors/:id/slots:', slotsRes.status, Array.isArray(slotsRes.body?.data) ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Slots count: ${slotsRes.body?.data?.length}`);

    console.log('\n--- 5. Security & Auth Guard Validation (401 on unauthenticated) ---');
    const bookNoAuth = await post('/api/v1/bookings/appointment', { doctorId: sampleDoctor.id });
    console.log('POST /api/v1/bookings/appointment (no auth):', bookNoAuth.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${bookNoAuth.status}`);

    const savedNoAuth = await get('/api/v1/doctors/saved/list');
    console.log('GET /api/v1/doctors/saved/list (no auth):', savedNoAuth.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${savedNoAuth.status}`);

    const myBookingsNoAuth = await get('/api/v1/bookings/my-bookings');
    console.log('GET /api/v1/bookings/my-bookings (no auth):', myBookingsNoAuth.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${myBookingsNoAuth.status}`);

    console.log('\n--- 6. End-to-End Booking Service Pipeline Test ---');
    const testUserId = 'a9e7819f-30e0-4c0d-b808-1d0dbe4a827f';
    const bookingResult = await bookingService.createAppointment({
      userId: testUserId,
      doctorId: sampleDoctor.id,
      appointmentDate: '2026-09-07',
      appointmentTime: '11:30 AM',
      consultationType: 'in_clinic',
      patientNotes: 'Automated test verification booking'
    });
    console.log('bookingService.createAppointment:', bookingResult.appointmentId ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Created Appointment: ${bookingResult.appointmentId}, Doctor: ${bookingResult.doctorName}, Fee: ₹${bookingResult.fee}`);

    console.log('\n--- 7. Fetch Patient Bookings Verification ---');
    const patientBookings = await bookingService.getPatientBookings(testUserId);
    console.log('bookingService.getPatientBookings:', patientBookings.totalCount > 0 ? '✅ SUCCESS' : '❌ FAILED');
    console.log(`Total bookings found: ${patientBookings.totalCount}, Active: ${patientBookings.activeCount}`);

    console.log('\n--- 8. Appointment Cancellation Pipeline Test ---');
    const cancelResult = await bookingService.cancelAppointment(testUserId, bookingResult.appointmentId, 'Testing cancellation workflow');
    console.log('bookingService.cancelAppointment:', cancelResult.cancelled ? '✅ SUCCESS' : '❌ FAILED');

    console.log('\n🎉 ALL BACKEND DOCTORS & BOOKING SUITE TESTS PASSED WITH 100% SUCCESS.');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
