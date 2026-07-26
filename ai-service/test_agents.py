"""
Quick test script to verify agents work
"""
from agents.scheduling_agent import SchedulingAgent
from agents.hall_allocation_agent import HallAllocationAgent
from agents.invigilator_agent import InvigilatorAgent
from agents.orchestrator import Orchestrator

# Test data
test_subjects = [
    {
        "_id": "test1",
        "subjectCode": "CS501",
        "subjectName": "Database Systems",
        "semester": 5,
        "department": "Computer Science",
        "credits": 4,
        "subjectType": "theory",
        "examConfig": {
            "theoryInternals": 2,
            "theoryExternal": True,
            "labInternals": 0,
            "labExternal": False
        }
    }
]

test_students = [
    {"_id": "s1", "usn": "TEST001", "name": "Alice", "department": "Computer Science", "semester": 5},
    {"_id": "s2", "usn": "TEST002", "name": "Bob", "department": "Computer Science", "semester": 5},
]

test_faculty = [
    {"_id": "f1", "employeeId": "FAC001", "name": "Dr. Smith", "department": "Electronics", "designation": "Professor", "subjectsAssigned": []},
    {"_id": "f2", "employeeId": "FAC002", "name": "Dr. Jones", "department": "Mechanical", "designation": "Professor", "subjectsAssigned": []},
]

test_halls = [
    {"_id": "h1", "hallName": "Hall A", "capacity": 100},
]

test_start_date = "2026-07-20"

print("Testing Scheduling Agent...")
sched = SchedulingAgent()
result = sched.run(
    subjects=test_subjects,
    start_date=test_start_date,
    exam_category="internal1",
    component="theory",
    constraints={}
)
print(f"Scheduling works! Created {result['total_exams']} exams")

print("\nTesting Hall Allocation Agent...")
hall_agent = HallAllocationAgent()
result2 = hall_agent.run(
    exams=result['scheduled_exams'],
    students=test_students,
    halls=test_halls,
    constraints={}
)
print(f"Hall allocation works! Created {result2['total_allocations']} allocations")

print("\nTesting Invigilator Agent...")
inv_agent = InvigilatorAgent()
result3 = inv_agent.run(
    exams=result['scheduled_exams'],
    faculty=test_faculty,
    hall_allocations=result2['hall_allocations'],
    constraints={}
)
print(f"Invigilator assignment works! Created {result3['total_assignments']} assignments")

print("\nTesting Orchestrator...")
orch = Orchestrator(sched, hall_agent, inv_agent)
final_result = orch.run_pipeline(
    subjects=test_subjects,
    students=test_students,
    faculty=test_faculty,
    halls=test_halls,
    constraints={"startDate": test_start_date, "examCategory": "internal1", "component": "theory"}
)
print(f"Orchestrator works!")
print(f"  - Exams: {final_result['summary']['exams_scheduled']}")
print(f"  - Allocations: {final_result['summary']['students_allocated']}")
print(f"  - Assignments: {final_result['summary']['invigilators_assigned']}")

print("\nAll agents working correctly!")
