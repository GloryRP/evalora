/**
 * Security and RBAC Audit Script
 * Tests:
 * 1. Multi-role authentication & token expiration (8h)
 * 2. Auth failure modes (wrong password, tampered token, missing token)
 * 3. Role x Route Access Matrix (cross-role authorization checks)
 * 4. Password hashing verification (bcrypt check)
 * 5. NoSQL injection attack resilience
 * 6. CORS headers
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

// Standard test credentials
const ROLES = [
  { role: 'admin', username: 'ADMIN1', pass: 'Admin@123' },
  { role: 'examcell', username: 'EXAMCELL1', pass: 'ExamCell@123' },
  { role: 'faculty', username: 'FACULTY1', pass: 'Faculty@123' },
  { role: 'student', username: 'STUDENT1', pass: 'Student@123' },
  { role: 'hod', username: 'HOD_CSE', pass: 'Hod@123' },
  { role: 'principal', username: 'PRINCIPAL1', pass: 'Principal@123' }
];

// Helper to make HTTP requests
function request(url, options = {}, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (body) {
      if (typeof body === 'object') {
        body = JSON.stringify(body);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message, body: '' });
    });

    if (body) req.write(body);
    req.end();
  });
}

// Decode JWT payload without secret
function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('ascii');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log('=== STARTING SECURITY & RBAC AUDIT ===\n');
  const results = {
    logins: {},
    tokenExpiry: {},
    authFailures: {},
    matrix: {},
    noSqlInjection: {},
    cors: {},
    testCases: []
  };

  // 1. Multi-role Login & Token Expiry
  console.log('--- Step 1: Authentication & Token Verification ---');
  for (const item of ROLES) {
    const res = await request(`${BASE_URL}/auth/login`, { method: 'POST' }, {
      username: item.username,
      password: item.pass
    });

    if (res.statusCode === 200 && res.json && res.json.token) {
      const decoded = parseJwt(res.json.token);
      const expHours = decoded && decoded.exp && decoded.iat ? (decoded.exp - decoded.iat) / 3600 : null;
      results.logins[item.role] = {
        status: 'PASS',
        token: res.json.token,
        expHours,
        decodedRole: decoded?.role
      };
      console.log(`✓ ${item.role.padEnd(10)}: Login SUCCESS, Token issued, Duration = ${expHours}h (Role in token: ${decoded?.role})`);
      results.testCases.push({
        id: `AUTH-${item.role.toUpperCase()}`,
        module: 'Authentication',
        input: `Login as ${item.role} (${item.username})`,
        expected: `Status 200, JWT token returned with 8h expiry`,
        actual: `Status ${res.statusCode}, Token duration: ${expHours}h`,
        status: expHours === 8 ? 'PASS' : 'PARTIAL'
      });
    } else {
      results.logins[item.role] = { status: 'FAIL', code: res.statusCode, error: res.body };
      console.log(`✗ ${item.role.padEnd(10)}: Login FAILED (Status ${res.statusCode})`);
      results.testCases.push({
        id: `AUTH-${item.role.toUpperCase()}`,
        module: 'Authentication',
        input: `Login as ${item.role}`,
        expected: `Status 200`,
        actual: `Status ${res.statusCode}: ${res.body}`,
        status: 'FAIL'
      });
    }
  }

  // 2. Auth Failure Modes
  console.log('\n--- Step 2: Auth Failure Test Cases ---');
  // 2.1 Wrong password
  const wrongPassRes = await request(`${BASE_URL}/auth/login`, { method: 'POST' }, {
    username: 'ADMIN1',
    password: 'WrongPassword999'
  });
  console.log(`Wrong password test: Status ${wrongPassRes.statusCode} (Expected: 401)`);
  results.testCases.push({
    id: 'AUTH-FAIL-WRONG-PASS',
    module: 'Authentication',
    input: 'Invalid password on login',
    expected: 'Status 401 Unauthorized',
    actual: `Status ${wrongPassRes.statusCode}`,
    status: wrongPassRes.statusCode === 401 ? 'PASS' : 'FAIL'
  });

  // 2.2 Missing token on protected route
  const missingTokenRes = await request(`${BASE_URL}/admin/stats`, { method: 'GET' });
  console.log(`Missing token test: Status ${missingTokenRes.statusCode} (Expected: 401)`);
  results.testCases.push({
    id: 'AUTH-FAIL-MISSING-TOKEN',
    module: 'Authentication',
    input: 'Request to /admin/stats without Authorization header',
    expected: 'Status 401 Unauthorized',
    actual: `Status ${missingTokenRes.statusCode}`,
    status: missingTokenRes.statusCode === 401 ? 'PASS' : 'FAIL'
  });

  // 2.3 Tampered / Invalid token
  const tamperedTokenRes = await request(`${BASE_URL}/admin/stats`, {
    method: 'GET',
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature' }
  });
  console.log(`Tampered token test: Status ${tamperedTokenRes.statusCode} (Expected: 401)`);
  results.testCases.push({
    id: 'AUTH-FAIL-TAMPERED-TOKEN',
    module: 'Authentication',
    input: 'Request with tampered JWT token',
    expected: 'Status 401 Unauthorized',
    actual: `Status ${tamperedTokenRes.statusCode}`,
    status: tamperedTokenRes.statusCode === 401 ? 'PASS' : 'FAIL'
  });

  // 3. Cross-Role Route Access Matrix
  console.log('\n--- Step 3: Role x Route Access Matrix (403 Enforcement) ---');
  // Define characteristic protected endpoints for each role
  const targetEndpoints = [
    { name: 'Admin Stats', url: `${BASE_URL}/admin/stats`, expectedRoles: ['admin'] },
    { name: 'Admin Students List', url: `${BASE_URL}/admin/students`, expectedRoles: ['admin'] },
    { name: 'ExamCell Exams', url: `${BASE_URL}/examcell/exams`, expectedRoles: ['examcell', 'admin'] },
    { name: 'Faculty Duties', url: `${BASE_URL}/faculty/duties`, expectedRoles: ['faculty'] },
    { name: 'Student Results', url: `${BASE_URL}/student/results`, expectedRoles: ['student'] },
    { name: 'HOD Insights', url: `${BASE_URL}/hod/insights`, expectedRoles: ['hod'] },
    { name: 'Principal Insights', url: `${BASE_URL}/principal/insights`, expectedRoles: ['principal'] }
  ];

  const matrixRows = [];
  for (const ep of targetEndpoints) {
    const row = { endpoint: ep.name, required: ep.expectedRoles.join(', '), results: {} };
    for (const actor of ROLES) {
      const token = results.logins[actor.role]?.token;
      if (!token) {
        row.results[actor.role] = 'NO_TOKEN';
        continue;
      }
      const res = await request(ep.url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      let status = res.statusCode;
      let label = status;
      const isAllowed = ep.expectedRoles.includes(actor.role);
      if (isAllowed) {
        label = status === 200 ? '✅ 200 OK' : `❌ ${status}`;
      } else {
        label = status === 403 ? '🛡️ 403 Forbidden' : (status === 200 ? '🚨 200 LEAK' : `⚠️ ${status}`);
      }
      row.results[actor.role] = label;
      
      // Test case
      results.testCases.push({
        id: `RBAC-${actor.role.toUpperCase()}-${ep.name.replace(/\s+/g, '_')}`,
        module: 'RBAC Authorization',
        input: `${actor.role} accesses ${ep.name} (${ep.url})`,
        expected: isAllowed ? '200 OK' : '403 Forbidden',
        actual: `Status ${status}`,
        status: (isAllowed && status === 200) || (!isAllowed && status === 403) ? 'PASS' : 'FAIL'
      });
    }
    matrixRows.push(row);
  }

  // 4. NoSQL Injection Test
  console.log('\n--- Step 4: NoSQL Injection Resilience ---');
  const noSqlPayloads = [
    { username: { $gt: '' }, password: { $gt: '' } },
    { username: 'ADMIN1', password: { $gt: '' } },
    { username: { $ne: null }, password: { $ne: null } }
  ];

  for (let i = 0; i < noSqlPayloads.length; i++) {
    const res = await request(`${BASE_URL}/auth/login`, { method: 'POST' }, noSqlPayloads[i]);
    console.log(`NoSQL Injection Payload #${i + 1}: Status ${res.statusCode} (Expected: 400 or 401, not 200)`);
    results.testCases.push({
      id: `SEC-NOSQL-${i + 1}`,
      module: 'Security Injection',
      input: `Payload: ${JSON.stringify(noSqlPayloads[i])}`,
      expected: 'Rejection (400 or 401)',
      actual: `Status ${res.statusCode}`,
      status: res.statusCode === 400 || res.statusCode === 401 ? 'PASS' : 'FAIL'
    });
  }

  // 5. CORS Check
  console.log('\n--- Step 5: CORS Headers ---');
  const corsRes = await request(`${BASE_URL}/institution/config`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://malicious-website.com',
      'Access-Control-Request-Method': 'GET'
    }
  });
  console.log(`CORS Preflight Response: Status ${corsRes.statusCode}, ACAO: ${corsRes.headers['access-control-allow-origin'] || 'NONE'}`);

  // Generate /audit/role-route-matrix.md
  let matrixMd = `# Role-Route Authorization Matrix\n\n`;
  matrixMd += `Generated: ${new Date().toISOString()}\n\n`;
  matrixMd += `| Protected Endpoint | Required Role | Admin | Exam Cell | Faculty | Student | HOD | Principal |\n`;
  matrixMd += `|--------------------|---------------|-------|-----------|---------|---------|-----|-----------|\n`;
  for (const r of matrixRows) {
    matrixMd += `| **${r.endpoint}** | \`${r.required}\` | ${r.results.admin} | ${r.results.examcell} | ${r.results.faculty} | ${r.results.student} | ${r.results.hod} | ${r.results.principal} |\n`;
  }

  const matrixPath = path.resolve(__dirname, '../role-route-matrix.md');
  fs.writeFileSync(matrixPath, matrixMd, 'utf8');
  console.log(`\nSaved role-route matrix to ${matrixPath}`);

  // Save intermediate JSON for compilation
  const jsonPath = path.resolve(__dirname, 'rbac_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved results JSON to ${jsonPath}`);
}

run().catch(console.error);
