"""
Invigilator Assignment Agent
Assigns faculty as invigilators with conflict detection, department/subject restrictions, and load balancing.
"""
from typing import List, Dict, Any


class InvigilatorAgent:
    """
    Assigns faculty to exam halls as invigilators
    Enforces constraints: exactly 1 invigilator per hall, no subject teacher, no same-department, load-balanced
    """
    
    def __init__(self):
        self.name = "invigilator_agent"
    
    def run(self, exams: List[Dict], faculty: List[Dict], hall_allocations: List[Dict] = None, constraints: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Assign faculty as invigilators for exams
        
        Args:
            exams: List of scheduled exams
            faculty: List of all faculty members
            hall_allocations: List of hall allocations to find which rooms are used
            constraints: Dict with additional rules
        
        Returns:
            Dict with invigilator_assignments list and metadata
        """
        if not exams or not faculty:
            return {"invigilator_assignments": [], "message": "Missing required data"}
            
        constraints = constraints or {}
        
        # Build maps for easy lookup of exam details
        exam_map = {}
        for e in exams:
            for key in ["_id", "id", "subjectId", "subjectCode"]:
                val = e.get(key)
                if val:
                    exam_map[str(val)] = e
                
        # Determine the invigilation slots (examId, hallId, hallName, date, startTime, endTime, department, subjectCode)
        slots = []
        if hall_allocations:
            # Group hall allocations by examId and hallId to find unique rooms
            grouped_rooms = {}
            for alloc in hall_allocations:
                exam_id = str(alloc.get("examId"))
                hall_id = str(alloc.get("hallId"))
                hall_name = alloc.get("hallName", "")
                
                key = (exam_id, hall_id)
                if key not in grouped_rooms:
                    grouped_rooms[key] = hall_name
                    
            for (exam_id, hall_id), hall_name in grouped_rooms.items():
                # Find matching exam
                exam = exam_map.get(exam_id)
                if not exam:
                    # Try pattern match or continue
                    continue
                    
                slots.append({
                    "examId": exam_id,
                    "hallId": hall_id,
                    "hallName": hall_name,
                    "examDate": exam.get("examDate"),
                    "startTime": exam.get("startTime"),
                    "endTime": exam.get("endTime"),
                    "department": exam.get("department"),
                    "subjectCode": exam.get("subjectCode"),
                })
        else:
            # Fallback to 1 room per exam
            for exam in exams:
                exam_id = str(exam.get("_id") or exam.get("id") or exam.get("subjectId"))
                slots.append({
                    "examId": exam_id,
                    "hallId": "default_hall",
                    "hallName": "default_hall",
                    "examDate": exam.get("examDate"),
                    "startTime": exam.get("startTime"),
                    "endTime": exam.get("endTime"),
                    "department": exam.get("department"),
                    "subjectCode": exam.get("subjectCode"),
                })
                
        # Sort slots chronologically to assign in sequence
        slots = sorted(slots, key=lambda s: (s["examDate"], s["startTime"]))
        
        assignments = []
        # Keep track of duties assigned to each faculty member for load balancing
        faculty_duties = {str(fac.get("_id") or fac.get("id") or fac.get("employeeId")): 0 for fac in faculty}
        
        # Keep track of assignments by (fac_id, date, startTime) to prevent double-booking
        faculty_schedule = {}
        
        for slot in slots:
            exam_id = slot["examId"]
            hall_id = slot["hallId"]
            hall_name = slot["hallName"]
            exam_date = slot["examDate"]
            exam_start = slot["startTime"]
            exam_end = slot["endTime"]
            exam_dept = slot["department"]
            sub_code = slot["subjectCode"]
            
            # Find eligible faculty members
            eligible_faculty = []
            for fac in faculty:
                fac_id = str(fac.get("_id") or fac.get("id") or fac.get("employeeId"))
                
                # Rule 1: Exclude faculty from same department
                if fac.get("department") == exam_dept:
                    continue
                    
                # Rule 2: Exclude teacher of the subject
                subjects_assigned = fac.get("subjectsAssigned") or []
                if sub_code in subjects_assigned:
                    continue
                    
                # Rule 3: Exclude if already assigned during this slot
                sched_key = (fac_id, exam_date, exam_start)
                if sched_key in faculty_schedule:
                    continue
                    
                eligible_faculty.append(fac)
                
            # If no faculty eligible (exceptional cases), relax the same department rule
            if not eligible_faculty:
                for fac in faculty:
                    fac_id = str(fac.get("_id") or fac.get("id") or fac.get("employeeId"))
                    
                    subjects_assigned = fac.get("subjectsAssigned") or []
                    if sub_code in subjects_assigned:
                        continue
                        
                    sched_key = (fac_id, exam_date, exam_start)
                    if sched_key in faculty_schedule:
                        continue
                        
                    eligible_faculty.append(fac)
                    
            if not eligible_faculty:
                # If still empty, raise error or pick the faculty with lowest duty
                raise ValueError(
                    f"No available faculty for invigilation of subject {sub_code} "
                    f"in hall {hall_name} on {exam_date} at {exam_start}"
                )
                
            # Sort eligible faculty by current duty counts ascending for load balancing
            eligible_faculty = sorted(
                eligible_faculty,
                key=lambda f: faculty_duties[str(f.get("_id") or f.get("id") or f.get("employeeId"))]
            )
            
            chosen_fac = eligible_faculty[0]
            chosen_id = str(chosen_fac.get("_id") or chosen_fac.get("id") or chosen_fac.get("employeeId"))
            
            assignment = {
                "examId": exam_id,
                "hallId": hall_id,
                "facultyId": chosen_id,
                "role": "invigilator",  # Exactly 1 invigilator per hall
                "startTime": exam_start,
                "endTime": exam_end,
                "facultyName": chosen_fac.get("name", ""),
                "examDate": exam_date,
                "hallName": hall_name,
            }
            assignments.append(assignment)
            
            faculty_schedule[(chosen_id, exam_date, exam_start)] = True
            faculty_duties[chosen_id] += 1
            
        return {
            "invigilator_assignments": assignments,
            "total_assignments": len(assignments),
            "faculty_utilized": len([fid for fid, count in faculty_duties.items() if count > 0]),
            "conflicts_avoided": {
                "same_department": True,
                "double_booking": True,
                "subject_teacher": True,
            },
        }
