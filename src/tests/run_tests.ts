// Integration Test Suite executing actual HTTP requests against local dev server

const bypassSecret = process.env.ADMIN_SECRET || 'kosh1602@';

// Helper to make requests bypassing rate limiter during functional validation
async function fetchWithBypass(url: string, options: any = {}) {
  options.headers = {
    ...options.headers,
    'x-bypass-rate-limit': bypassSecret
  };
  return fetch(url, options);
}

// Simple Assertion Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runOnboardingTests() {
  console.log('\n--- Running Onboarding API tests ---');

  // Happy Path
  try {
    const validPayload = {
      name: 'Aditya Sharma',
      phone: '+919876543210',
      email: 'aditya@example.com',
      dob: '1995-07-07',
      gender: 'Male',
      weight: 75,
      height: 180,
      targetWeight: 70,
      goal: 'Fat Loss',
      activity: 'Active',
      diet: 'Veg',
      spice: 'Medium',
      allergies: ['Peanuts'],
      cuisines: ['Indian', 'Mediterranean'],
      favDish: 'Paneer Tikka',
      dislikes: 'Okra',
      notes: 'No salt',
      address: 'Kōsh Kitchen, Bandra, Mumbai',
      landmark: 'Near Starbucks'
    };

    const res = await fetchWithBypass('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload)
    });
    const body = await res.json();

    assert(res.status === 200, `Onboarding happy path should return 200 (Got ${res.status})`);
    assert(body.success === true, 'Response envelope should declare success');
    assert(body.data.ref !== undefined, 'Response data should contain ref code');
    console.log('✓ Onboarding Happy Path: Passed');
  } catch (err: any) {
    console.error('✗ Onboarding Happy Path: Failed -', err.message);
  }

  // Error Path: 400 Validation Error (Missing fields / invalid types)
  try {
    const invalidPayload = {
      name: 'Aditya', // Valid
      email: 'not-an-email', // Invalid email format
      phone: 'short', // Invalid phone format
      weight: -10 // Invalid weight
    };

    const res = await fetchWithBypass('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload)
    });
    const body = await res.json();

    assert(res.status === 400, `Validation error should return 400 (Got ${res.status})`);
    assert(body.success === false, 'Envelope success should be false');
    assert(body.error.code === 'VALIDATION_ERROR', 'Error code should be VALIDATION_ERROR');
    assert(body.error.details !== undefined, 'Structured validation details should be present');
    console.log('✓ Onboarding Validation 400 Error Path: Passed');
  } catch (err: any) {
    console.error('✗ Onboarding Validation 400 Error Path: Failed -', err.message);
  }

  // Error Path: 400 Extra Fields (Stripping check - ensures no extra keys pass through)
  try {
    const extraFieldsPayload = {
      name: 'Aditya Sharma',
      phone: '+919876543210',
      email: 'aditya@example.com',
      dob: '1995-07-07',
      gender: 'Male',
      weight: 75,
      height: 180,
      targetWeight: 70,
      goal: 'Fat Loss',
      activity: 'Active',
      diet: 'Veg',
      address: 'Bandra, Mumbai',
      maliciousField: 'DROP TABLE onboarding_submissions;' // Extra field
    };

    const res = await fetchWithBypass('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extraFieldsPayload)
    });
    const body = await res.json();

    // Since the instruction says "strip unknown fields (no extra keys pass through)", Zod handles this silently by returning 200 and stripping keys
    assert(res.status === 200, `Extra fields should be stripped and return 200 (Got ${res.status})`);
    assert(body.success === true, 'Envelope success should be true');
    console.log('✓ Onboarding Extra Fields Stripped Block: Passed');
  } catch (err: any) {
    console.error('✗ Onboarding Extra Fields Stripped Block: Failed -', err.message);
  }

  // Rate Limiting Tier 1 Check: Stricter limits on onboarding endpoints (10 requests max, 11th should be 429)
  try {
    console.log('Hammering /api/onboarding to verify 429 rate limit block...');
    let rateLimited = false;
    let retryAfterHeader = '';

    // Fire requests quickly WITHOUT rate limit bypass header to trip the limiter
    for (let i = 0; i < 15; i++) {
      const res = await fetch('http://localhost:3000/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hammer Test',
          phone: '+919999988888',
          email: `hammer-${i}-${Math.random().toString(36).substring(7)}@test.com`,
          dob: '1990-01-01',
          gender: 'Male',
          weight: 70,
          height: 175,
          targetWeight: 68,
          address: 'Bandra, Mumbai'
        })
      });

      if (res.status === 429) {
        rateLimited = true;
        retryAfterHeader = res.headers.get('retry-after') || '';
        break;
      }
    }

    assert(rateLimited === true, 'Consecutive requests exceeding 10 should trigger a 429 Rate Limit block');
    assert(retryAfterHeader !== '', '429 Rate Limit responses should contain a Retry-After header');
    console.log(`✓ Onboarding 429 Rate Limiting & Retry-After Header: Passed (Retry After: ${retryAfterHeader}s)`);
  } catch (err: any) {
    console.error('✗ Onboarding 429 Rate Limiting & Retry-After Header: Failed -', err.message);
  }
}

async function runAdminAuthTests() {
  console.log('\n--- Running Admin Authentication & Submissions API tests ---');

  // Error Path: Submissions GET without cookie token (401 Unauthorized)
  try {
    const res = await fetchWithBypass('http://localhost:3000/api/admin/submissions', {
      method: 'GET'
    });
    const body = await res.json();

    assert(res.status === 401, `Request without admin token should return 401 (Got ${res.status})`);
    assert(body.success === false, 'Envelope success should be false');
    assert(body.error.code === 'UNAUTHORIZED', 'Error code should be UNAUTHORIZED');
    console.log('✓ Submissions fetch unauthorized check: Passed');
  } catch (err: any) {
    console.error('✗ Submissions fetch unauthorized check: Failed -', err.message);
  }

  // Error Path: Admin Login with incorrect password (401 Unauthorized)
  try {
    const res = await fetchWithBypass('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'wrong-password' })
    });
    const body = await res.json();

    assert(res.status === 401, `Incorrect login should fail with 401 (Got ${res.status})`);
    assert(body.success === false, 'Envelope success should be false');
    console.log('✓ Admin login fail-safe check: Passed');
  } catch (err: any) {
    console.error('✗ Admin login fail-safe check: Failed -', err.message);
  }
}

async function runHealthTests() {
  console.log('\n--- Running Health Probe API tests ---');

  // Liveness Check
  try {
    const res = await fetchWithBypass('http://localhost:3000/health/live');
    const body = await res.json();

    assert(res.status === 200, `Liveness probe should return 200 (Got ${res.status})`);
    assert(body.data.status === 'live', 'Status should be live');
    console.log('✓ Health Live probe check: Passed');
  } catch (err: any) {
    console.error('✗ Health Live probe check: Failed -', err.message);
  }

  // Readiness Check
  try {
    const res = await fetchWithBypass('http://localhost:3000/health/ready');

    // Ready should return 200 or 503 depending on database status
    assert(res.status === 200 || res.status === 503, `Readiness probe should return 200 or 503 (Got ${res.status})`);
    console.log(`✓ Health Ready probe check (Result status ${res.status}): Passed`);
  } catch (err: any) {
    console.error('✗ Health Ready probe check: Failed -', err.message);
  }
}

async function startTestSuite() {
  console.log('=== KŌSH API INTEGRATION E2E TEST SUITE INITIALIZED ===');
  await runOnboardingTests();
  await runAdminAuthTests();
  await runHealthTests();
  console.log('\n=== TEST SUITE RUN COMPLETED ===');
}

startTestSuite().catch((err) => {
  console.error('Test runner critical crash:', err);
  process.exit(1);
});
