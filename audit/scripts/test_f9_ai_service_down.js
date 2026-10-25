/**
 * Test AI Service Down behavior for POST /api/v1/examcell/agents/run-evaluation
 * Usage: node audit/scripts/test_f9_ai_service_down.js
 */
const axios = require('../../server/node_modules/axios');

const SERVER_BASE = 'http://localhost:5000/api/v1';

async function testAiDown() {
  console.log('====================================================');
  console.log('   TEST: runEvaluationAgent WHEN AI SERVICE IS DOWN');
  console.log('====================================================\n');

  // 1. Get Exam Cell token
  const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, {
    username: 'EXAMCELL1',
    password: 'ExamCell@123'
  });
  const token = ecLogin.data.token || ecLogin.data.data?.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('1. Calling runEvaluationAgent while AI service is temporarily unavailable...');
  try {
    const res = await axios.post(`${SERVER_BASE}/examcell/agents/run-evaluation`, {}, { headers });
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('\n--- AI SERVICE DOWN API RESPONSE ---');
    console.log('HTTP Status Code:', err.response?.status);
    console.log('Response Headers:', err.response?.headers);
    console.log('Response Body:', JSON.stringify(err.response?.data, null, 2));
    console.log('------------------------------------\n');
  }
}

testAiDown();
