# AI Pipeline Performance & Constraint Validation

Generated: 2026-10-10T06:44:45.496Z

## Dataset Size Used (Semester 5)
- **Subjects**: 12
- **Students**: 13
- **Faculty**: 10
- **Halls**: 6

## Pipeline Latency (5 Consecutive Runs)

| Run # | Status Code | Execution Time (ms) | Result Status |
|-------|-------------|---------------------|---------------|
| Run 1 | 200 | **21 ms** | ✅ Success |
| Run 2 | 200 | **24 ms** | ✅ Success |
| Run 3 | 200 | **24 ms** | ✅ Success |
| Run 4 | 200 | **24 ms** | ✅ Success |
| Run 5 | 200 | **23 ms** | ✅ Success |

**Average Pipeline Execution Time**: `23 ms` (~0.02 seconds)

## Validation of Persisted Constraints

| Constraint Check | Status | Evidence / Analysis |
|------------------|--------|---------------------|
| **a) No two exams of same semester on same date** | ✅ PASS | All scheduled exams on distinct dates |
| **b) No hall assigned more students than capacity** | ✅ PASS | All halls within capacity |
| **c) Exactly one seat per student per exam (no duplicates)** | ✅ PASS | No duplicate seats per student per exam |
| **d) No HOD in invigilator pool & no same-dept invigilator** | ✅ PASS | HOD assigned: false, Same-dept assigned: false |
| **e) No invigilator double-booked in same slot** | ❌ FAIL | Double booking for faculty 6a67619d48abfd1ebf566bac at undefined 09:00 |
| **f) Morning and Afternoon slot usage** | ✅ PASS | Morning slots: 1, Afternoon slots: 0 |

## Direct FastAPI Agent Verification

| Endpoint | Test Case | Status Code | Finding |
|----------|-----------|-------------|---------|
| `GET /agents/health` | Health check | 200 | Service is healthy and reporting core agents ready |
| `POST /agents/schedule` | Empty subjects payload | 422 | Handled gracefully (Validated) |
| `POST /agents/compute-gpa` | Sample student calculation | 200 | Calculated SGPA: N/A |
| `GET /agents/analytics/health` | Scikit-learn model health | 200 | ML Model status: loaded (scikit-learn 1.9.0) |
