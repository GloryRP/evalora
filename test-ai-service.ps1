# Test AI Service Connectivity
Write-Host "Testing AI Service..." -ForegroundColor Cyan

# Test 1: Check if Python service is running
Write-Host "`n1. Testing Python AI Service Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/agents/health" -Method Get
    Write-Host "   ✓ Python AI Service is running!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Agents: $($health.agents | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Python AI Service is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   SOLUTION: Start the Python service:" -ForegroundColor Yellow
    Write-Host "   cd ai-service" -ForegroundColor Cyan
    Write-Host "   python -m uvicorn main:app --reload --port 8000" -ForegroundColor Cyan
    exit 1
}

# Test 2: Check if Node.js backend can reach Python
Write-Host "`n2. Testing if Node.js backend is running..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
    Write-Host "   ✓ Node.js Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js Backend is NOT running!" -ForegroundColor Red
    Write-Host "`n   SOLUTION: Start the backend:" -ForegroundColor Yellow
    Write-Host "   cd server" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor Cyan
    exit 1
}

# Test 3: Test scheduling agent directly
Write-Host "`n3. Testing Scheduling Agent..." -ForegroundColor Yellow
$testPayload = @{
    subjects = @(
        @{
            _id = "test123"
            subjectCode = "TEST101"
            subjectName = "Test Subject"
            semester = 5
            department = "Computer Science"
            credits = 4
        }
    )
    constraints = @{
        minGapBetweenExams = 1
        maxExamsPerDay = 3
    }
} | ConvertTo-Json -Depth 10

try {
    $result = Invoke-RestMethod -Uri "http://localhost:8000/agents/schedule" -Method Post -Body $testPayload -ContentType "application/json"
    Write-Host "   ✓ Scheduling Agent works!" -ForegroundColor Green
    Write-Host "   Scheduled Exams: $($result.result.total_exams)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Scheduling Agent failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✓ All tests completed!" -ForegroundColor Green
Write-Host "If all tests passed, the pipeline should work." -ForegroundColor Cyan
