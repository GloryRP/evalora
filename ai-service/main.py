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
from agents.gpa_agent import GPAAgent
from agents.analytics_agent import AnalyticsAgent

app = FastAPI(title="Exam Automation AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class USNExtractInput(BaseModel):
    fileName: str

@app.post("/agents/extract-usn")
def extract_usn_from_script(data: USNExtractInput):
    """
    Extracts student USN from the answer script filename/content
    """
    import re
    match = re.search(r'(\d[a-zA-Z]{2}\d{2}[a-zA-Z]{2}\d{3})', data.fileName)
    if match:
        return {
            "success": True,
            "usn": match.group(1).upper(),
            "extractedBy": "AI-OCR Regex Model"
        }
    return {
        "success": False,
        "message": "No valid USN found in filename"
    }


# Initialize agents
scheduling_agent = SchedulingAgent()
hall_allocation_agent = HallAllocationAgent()
invigilator_agent = InvigilatorAgent()
gpa_agent = GPAAgent()
analytics_agent = AnalyticsAgent()
orchestrator = Orchestrator(scheduling_agent, hall_allocation_agent, invigilator_agent)

# Pydantic models for request/response
class SubjectInput(BaseModel):
    _id: str
    subjectCode: str
    subjectName: str
    department: str
    semester: int
    credits: int
    subjectType: Optional[str] = "theory"
    examConfig: Optional[Dict[str, Any]] = None

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
    subjectsAssigned: Optional[List[str]] = []

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
    start_date: str
    exam_category: str
    component: str
    constraints: Optional[Dict[str, Any]] = {}

class HallAllocationInput(BaseModel):
    exams: List[Dict[str, Any]]
    students: List[StudentInput]
    halls: List[HallInput]
    constraints: Optional[Dict[str, Any]] = {}

class InvigilatorInput(BaseModel):
    exams: List[Dict[str, Any]]
    faculty: List[FacultyInput]
    hall_allocations: Optional[List[Dict[str, Any]]] = None
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
        result = scheduling_agent.run(
            subjects=subjects_dict,
            start_date=data.start_date,
            exam_category=data.exam_category,
            component=data.component,
            constraints=data.constraints
        )
        
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
            data.hall_allocations,
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

@app.post("/agents/compute-gpa")
def compute_gpa(data: Dict[str, Any]):
    """
    Run the GPA calculation agent
    """
    try:
        result = gpa_agent.run(data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "gpa"
            }
        )

@app.post("/agents/analytics")
def run_analytics(data: Dict[str, Any]):
    """
    Run statistical analysis and slow learner prediction
    """
    try:
        result = analytics_agent.run(data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "analytics"
            }
        )

@app.post("/agents/slow-learners")
def run_slow_learners(data: Dict[str, Any]):
    """
    Get slow learners only
    """
    try:
        result = analytics_agent.run(data)
        if result.get("status") == "SUCCESS":
            return {
                "status": "SUCCESS",
                "slowLearners": result.get("slowLearners", []),
                "modelInfo": result.get("modelInfo", {})
            }
        else:
            return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "slow_learners"
            }
        )

@app.get("/agents/analytics/health")
def analytics_health():
    """
    Health check for ML model and scikit-learn
    """
    try:
        import sklearn
        analytics_agent._ensure_model_trained()
        return {
            "status": "ok",
            "mlModel": "loaded" if analytics_agent.model is not None else "not_loaded",
            "scikitLearnVersion": sklearn.__version__
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

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
        
        # Debug: Print first subject to see what we're getting
        if subjects_dict:
            print(f"DEBUG: First subject keys: {list(subjects_dict[0].keys())}")
            print(f"DEBUG: First subject _id value: {subjects_dict[0].get('_id', 'NOT FOUND')}")
            print(f"DEBUG: First subject full: {subjects_dict[0]}")
        
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
        import sys
        import traceback
        # Print full traceback to console for debugging
        print(f"\n{'='*60}")
        print("ERROR in run_full_pipeline:")
        print(f"{'='*60}")
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "traceback": traceback.format_exc(),
                "agent": "orchestrator"
            }
        )