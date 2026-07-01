from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import traceback

from agents.orchestrator import Orchestrator
from agents.scheduling_agent import SchedulingAgent
from agents.hall_allocation_agent import HallAllocationAgent
from agents.invigilator_agent import InvigilatorAgent

app = FastAPI(title="Exam Automation AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
scheduling_agent = SchedulingAgent()
hall_allocation_agent = HallAllocationAgent()
invigilator_agent = InvigilatorAgent()
orchestrator = Orchestrator(scheduling_agent, hall_allocation_agent, invigilator_agent)

# Pydantic models for request/response
class SubjectInput(BaseModel):
    _id: str
    subjectCode: str
    subjectName: str
    department: str
    semester: int
    credits: int

class StudentInput(BaseModel):
    _id: str
    usn: str
    name: str
    department: str
    semester: int

class FacultyInput(BaseModel):
    _id: str
    employeeId: str
    name: str
    department: str
    designation: str

class HallInput(BaseModel):
    _id: str
    hallName: str
    capacity: int

class PipelineInput(BaseModel):
    subjects: List[SubjectInput]
    students: List[StudentInput]
    faculty: List[FacultyInput]
    halls: List[HallInput]
    constraints: Optional[Dict[str, Any]] = {}

class ScheduleInput(BaseModel):
    subjects: List[SubjectInput]
    constraints: Optional[Dict[str, Any]] = {}

class HallAllocationInput(BaseModel):
    exams: List[Dict[str, Any]]
    students: List[StudentInput]
    halls: List[HallInput]
    constraints: Optional[Dict[str, Any]] = {}

class InvigilatorInput(BaseModel):
    exams: List[Dict[str, Any]]
    faculty: List[FacultyInput]
    constraints: Optional[Dict[str, Any]] = {}

@app.get("/")
def root():
    return {"status": "ok", "message": "AI agent service is running"}

@app.get("/agents/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "exam-automation-ai-service",
        "timestamp": datetime.utcnow().isoformat(),
        "agents": {
            "scheduling": "ready",
            "hall_allocation": "ready",
            "invigilator": "ready",
            "orchestrator": "ready"
        }
    }

@app.post("/agents/schedule")
def schedule_exams(data: ScheduleInput):
    """
    Run only the scheduling agent
    Creates exam timetable from subjects
    """
    try:
        subjects_dict = [subject.dict() for subject in data.subjects]
        result = scheduling_agent.run(subjects_dict, data.constraints)
        
        return {
            "success": True,
            "agent": "scheduling",
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "scheduling"
            }
        )

@app.post("/agents/allocate-halls")
def allocate_halls(data: HallAllocationInput):
    """
    Run only the hall allocation agent
    Assigns students to halls with anti-malpractice spacing
    """
    try:
        students_dict = [student.dict() for student in data.students]
        halls_dict = [hall.dict() for hall in data.halls]
        
        result = hall_allocation_agent.run(
            data.exams,
            students_dict,
            halls_dict,
            data.constraints
        )
        
        return {
            "success": True,
            "agent": "hall_allocation",
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "hall_allocation"
            }
        )

@app.post("/agents/assign-invigilators")
def assign_invigilators(data: InvigilatorInput):
    """
    Run only the invigilator assignment agent
    Assigns faculty to exam halls with constraints
    """
    try:
        faculty_dict = [faculty.dict() for faculty in data.faculty]
        
        result = invigilator_agent.run(
            data.exams,
            faculty_dict,
            data.constraints
        )
        
        return {
            "success": True,
            "agent": "invigilator",
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "invigilator"
            }
        )

@app.post("/agents/run-pipeline")
def run_full_pipeline(data: PipelineInput):
    """
    Run the complete orchestrated pipeline
    1. Schedule exams from subjects
    2. Allocate students to halls
    3. Assign invigilators
    """
    try:
        # Convert Pydantic models to dicts
        subjects_dict = [subject.dict() for subject in data.subjects]
        students_dict = [student.dict() for student in data.students]
        faculty_dict = [faculty.dict() for faculty in data.faculty]
        halls_dict = [hall.dict() for hall in data.halls]
        
        # Run orchestrator
        result = orchestrator.run_pipeline(
            subjects_dict,
            students_dict,
            faculty_dict,
            halls_dict,
            data.constraints
        )
        
        return {
            "success": True,
            "agent": "orchestrator",
            "timestamp": datetime.utcnow().isoformat(),
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "orchestrator"
            }
        )