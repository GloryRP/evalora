"""
Orchestrator Agent
Runs all agents in sequence: scheduling → hall allocation → invigilator assignment
"""
from typing import List, Dict, Any


class Orchestrator:
    """
    Orchestrates the complete exam automation pipeline
    """
    
    def __init__(self, scheduling_agent, hall_allocation_agent, invigilator_agent):
        self.scheduling_agent = scheduling_agent
        self.hall_allocation_agent = hall_allocation_agent
        self.invigilator_agent = invigilator_agent
    
    def run_pipeline(
        self,
        subjects: List[Dict],
        students: List[Dict],
        faculty: List[Dict],
        halls: List[Dict],
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Run the complete pipeline
        
        Args:
            subjects: List of subjects to schedule
            students: List of students to allocate
            faculty: List of faculty for invigilation
            halls: List of available halls
            constraints: Combined constraints for all agents
        
        Returns:
            Dict with results from all agents
        """
        if not subjects:
            raise ValueError("No subjects provided for scheduling")
        if not students:
            raise ValueError("No students available for allocation")
        if not faculty:
            raise ValueError("No faculty available for invigilation")
        if not halls:
            raise ValueError("No halls available for allocation")
        
        constraints = constraints or {}
        
        # Step 1: Schedule exams
        print("Step 1: Running scheduling agent...")
        # F6: Pass startDate directly without silent fallback so scheduling agent validates it
        start_date = constraints.get("startDate")
            
        exam_category = constraints.get("examCategory", "internal1")
        component = constraints.get("component", "theory")
        
        scheduling_result = self.scheduling_agent.run(
            subjects=subjects,
            start_date=start_date,
            exam_category=exam_category,
            component=component,
            constraints=constraints
        )
        scheduled_exams = scheduling_result.get("scheduled_exams", [])
        
        if not scheduled_exams:
            raise ValueError("Scheduling failed: no exams scheduled")
        
        # Step 2: Allocate halls
        print("Step 2: Running hall allocation agent...")
        allocation_result = self.hall_allocation_agent.run(
            scheduled_exams,
            students,
            halls,
            constraints
        )
        hall_allocations = allocation_result.get("hall_allocations", [])
        
        # Step 3: Assign invigilators
        print("Step 3: Running invigilator assignment agent...")
        invigilator_result = self.invigilator_agent.run(
            exams=scheduled_exams,
            faculty=faculty,
            hall_allocations=hall_allocations,
            constraints=constraints
        )
        invigilator_assignments = invigilator_result.get("invigilator_assignments", [])
        
        # Combine results
        unseated_count = allocation_result.get("unseated_count", 0)
        summary = {
            "exams_scheduled": len(scheduled_exams),
            "students_allocated": len(hall_allocations),
            "invigilators_assigned": len(invigilator_assignments),
            "halls_used": allocation_result.get("halls_used", 0),
            "faculty_utilized": invigilator_result.get("faculty_utilized", 0),
            "unseated_count": unseated_count,
        }
        if allocation_result.get("warning"):
            summary["warning"] = allocation_result.get("warning")

        return {
            "scheduled_exams": scheduled_exams,
            "hall_allocations": hall_allocations,
            "invigilator_assignments": invigilator_assignments,
            "unseated_students": allocation_result.get("unseated_students", []),
            "unseated_count": unseated_count,
            "summary": summary,
            "metadata": {
                "scheduling": scheduling_result,
                "allocation": allocation_result,
                "invigilation": invigilator_result,
            },
        }
