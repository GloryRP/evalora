# Start Python AI Service

Open a **NEW TERMINAL** and run:

```powershell
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Test if it's running:

In another terminal or browser, visit:
```
http://localhost:8000/agents/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "exam-automation-ai-service",
  "timestamp": "2026-07-01T...",
  "agents": {
    "scheduling": "ready",
    "hall_allocation": "ready",
    "invigilator": "ready",
    "orchestrator": "ready"
  }
}
```

## If you get errors when starting:

### Error: "ModuleNotFoundError: No module named 'agents'"
- The agents folder was created, make sure it has `__init__.py`
- Check that you're in the `ai-service` directory

### Error: "cannot import name 'Orchestrator'"
- Make sure all 4 agent files exist in `ai-service/agents/`:
  - `__init__.py`
  - `scheduling_agent.py`
  - `hall_allocation_agent.py`
  - `invigilator_agent.py`
  - `orchestrator.py`

### Error: Port 8000 already in use
```powershell
# Find and kill the process
$process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

Then try starting again.
