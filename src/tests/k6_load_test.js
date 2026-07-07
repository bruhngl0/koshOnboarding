import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test Configuration
 * Targets p95 latency under 200ms at approximately 100 requests per second.
 */
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up to 50 virtual users
    { duration: '1m', target: 50 },  // Hold at 50 VUs (approx 100 RPS depending on latency)
    { duration: '15s', target: 0 },  // Ramp-down to 0 VUs
  ],
  thresholds: {
    // Enforce p95 latency < 200ms constraint
    http_req_duration: ['p(95)<200'],
    // Enforce error rates are below 1%
    http_req_failed: ['rate<0.01'],
  },
};

// Generates dynamic email to prevent unique index collisions on DB during load test
function generateRandomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let email = '';
  for (let i = 0; i < 8; i++) {
    email += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${email}@loadtest.kosh.table`;
}

export default function () {
  const url = 'http://localhost:3000/api/onboarding';
  
  const payload = JSON.stringify({
    name: 'Load Test Client',
    phone: '+919999988888',
    email: generateRandomEmail(),
    dob: '1990-01-01',
    gender: 'Other',
    weight: 70,
    height: 175,
    targetWeight: 68,
    goal: 'Maintenance',
    activity: 'Lightly Active',
    diet: 'Non-Veg',
    spice: 'Medium',
    allergies: [],
    cuisines: ['Indian'],
    favDish: 'Rice',
    dislikes: 'None',
    medical: 'None',
    deliveryPlan: 'Weekly',
    address: 'Mumbai Kitchen Studio',
    landmark: 'Central Park',
    deliveryNote: 'Leave at gate',
    notes: 'No spicy food'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
  };

  const response = http.post(url, payload, params);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'success is true': (r) => JSON.parse(r.body).success === true,
  });

  // Sleep 500ms between requests per virtual user to average 100 RPS total with 50 VUs
  sleep(0.5);
}
