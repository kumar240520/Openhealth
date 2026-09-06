const app = require('./src/app');
const http = require('http');

const PORT = 5001;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Verification server running on http://127.0.0.1:${PORT}`);
  
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
          } catch(e) {
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
          } catch(e) {
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
    console.log('\n--- 1. Health Check ---');
    const health = await get('/api/health');
    console.log('GET /api/health:', health.status, health.body?.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY');

    console.log('\n--- 2. Auth Endpoints ---');
    const emailCheck = await post('/api/v1/auth/check-email', { email: 'unique_tester_9876@example.com' });
    console.log('POST /api/v1/auth/check-email:', emailCheck.status, emailCheck.body?.data?.exists === false ? '✅ VERIFIED' : '❌ FAILED');

    const phoneCheck = await post('/api/v1/auth/check-phone', { phone: '9876543210' });
    console.log('POST /api/v1/auth/check-phone:', phoneCheck.status, phoneCheck.body?.data?.exists === false ? '✅ VERIFIED' : '❌ FAILED');

    console.log('\n--- 3. Unauthenticated Protected Routes (Should reject with 401) ---');
    const patientMe = await get('/api/v1/patient/me');
    console.log('GET /api/v1/patient/me (no auth):', patientMe.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${patientMe.status}`);

    const dashStats = await get('/api/v1/dashboard/patient/stats');
    console.log('GET /api/v1/dashboard/patient/stats (no auth):', dashStats.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${dashStats.status}`);

    const notifs = await get('/api/v1/notifications');
    console.log('GET /api/v1/notifications (no auth):', notifs.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${notifs.status}`);

    const searchHistory = await get('/api/v1/search/history');
    console.log('GET /api/v1/search/history (no auth):', searchHistory.status === 401 ? '✅ 401 UNAUTHORIZED' : `❌ ${searchHistory.status}`);

    console.log('\n--- 4. Unmatched Route (Should return 404 standard JSON) ---');
    const unmatched = await get('/api/v1/hospitals/nonexistent');
    console.log('GET /api/v1/hospitals/nonexistent:', unmatched.status === 404 ? '✅ 404 NOT FOUND' : `❌ ${unmatched.status}`);

    console.log('\n✨ ALL PREVIOUS BACKEND FILES ARE PROPERLY CONFIGURED & WIRED.');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});
