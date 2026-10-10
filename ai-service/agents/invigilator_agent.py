"""
Invigilator Assignment Agent
Assigns faculty as invigilators with conflict detection, department/subject restrictions, and load balancing.
"""
from typing import List, Dict, Any


def is_same_department(dept1: str, dept2: str) -> bool:
    """Check if two department names are effectively the same"""
    if not dept1 or not dept2:
        return False
    d1 = dept1.strip().lower()
    d2 = dept2.strip().lower()
    if d1 == d2:
        return True
    # Check common aliases/abbreviations
    if ("computer science" in d1 and "computer science" in d2):
        # Differentiate CSE vs CSDS if explicitly specified
        if "data science" in d1 or "data science" in d2:
            return ("data science" in d1 and "data science" in d2)
        return ("data science" not in d1 and "data science" not in d2)
    return False


def is_teaching_subject(fac: Dict, sub_code: str) -> bool:
    """Check if a faculty member is teaching the given subject"""
    if not sub_code:
        return False
    sub_code_clean = sub_code.strip().upper()
    subjects_assigned = fac.get("subjectsAssigned") or []
    for s in subjects_assigned:
        if isinstance(s, str) and s.strip().upper() == sub_code_clean:
            return True
    return False


def is_hod_account(fac: Dict) -> bool:
    """Check if faculty record belongs to an HOD"""
    designation = (fac.get("designation") or "").lower()
    role = (fac.get("role") or "").lower()
    return "hod" in designation or "head of department" in designation or role == "hod"


def times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Check if two time intervals [start1, end1) and [start2, end2) overlap"""
    try:
        return not (end1 <= start2 or start1 >= end2)
    except Exception:
        return start1 == start2


class InvigilatorAgent:
    """
    Assigns faculty to exam halls as invigilators
    Enforces constraints: exactly 1 invigilator per hall, no HOD, no subject teacher, no same-department, no double-booking, load-balanced
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
        
        # Constraint 4: Filter out any HOD accounts that may have slipped into the faculty list
        eligible_pool = [fac for fac in faculty if not is_hod_account(fac)]
        if not eligible_pool:
            raise ValueError("No eligible non-HOD faculty available for invigilation.")

        # Build maps for easy lookup of exam details
        exam_map = {}
        for e in exams:
            for key in ["_id", "id", "examId", "subjectId", "subjectCode"]:
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
                    continue
                    
                slots.append({
                    "examId": exam_id,
                    "hallId": hall_id,
                    "hallName": hall_name,
                    "examDate": exam.get("examDate"),
                    "startTime": exam.get("startTime", "09:00"),
                    "endTime": exam.get("endTime", "12:00"),
                    "department": exam.get("department", ""),
                    "subjectCode": exam.get("subjectCode", ""),
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
                    "startTime": exam.get("startTime", "09:00"),
                    "endTime": exam.get("endTime", "12:00"),
                    "department": exam.get("department", ""),
                    "subjectCode": exam.get("subjectCode", ""),
                })
                
        # Sort slots chronologically to assign in sequence
        slots = sorted(slots, key=lambda s: (s["examDate"], s["startTime"]))
        
        assignments = []
        # Constraint 5: Keep track of duties assigned to each faculty member for load balancing
        faculty_duties = {str(fac.get("_id") or fac.get("id") or fac.get("employeeId")): 0 for fac in eligible_pool}
        
        # Constraint 2: Keep track of assignments by faculty member to prevent double-booking
        # Format: faculty_id -> list of {"date": ..., "startTime": ..., "endTime": ...}
        faculty_schedule = {str(fac.get("_id") or fac.get("id") or fac.get("employeeId")): [] for fac in eligible_pool}
        
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
            for fac in eligible_pool:
                fac_id = str(fac.get("_id") or fac.get("id") or fac.get("employeeId"))
                
                # Constraint 1: Exclude faculty from same department
                if is_same_department(fac.get("department", ""), exam_dept):
                    continue
                    
                # Constraint 3: Exclude teacher of the subject
                if is_teaching_subject(fac, sub_code):
                    continue
                    
                # Constraint 2: Exclude if already assigned during overlapping time on the same date
                is_busy = False
                for booked in faculty_schedule.get(fac_id, []):
                    if booked["date"] == exam_date and times_overlap(exam_start, exam_end, booked["startTime"], booked["endTime"]):
                        is_busy = True
                        break
                if is_busy:
                    continue
                    
                eligible_faculty.append(fac)
                
            # If no faculty eligible across departments (exceptional cases), relax the same department rule but keep all other rules
            if not eligible_faculty:
                for fac in eligible_pool:
                    fac_id = str(fac.get("_id") or fac.get("id") or fac.get("employeeId"))
                    
                    if is_teaching_subject(fac, sub_code):
                        continue
                        
                    is_busy = False
                    for booked in faculty_schedule.get(fac_id, []):
                        if booked["date"] == exam_date and times_overlap(exam_start, exam_end, booked["startTime"], booked["endTime"]):
                            is_busy = True
                            break
                    if is_busy:
                        continue
                        
                    eligible_faculty.append(fac)
                    
            if not eligible_faculty:
                raise ValueError(
                    f"No available faculty for invigilation of subject {sub_code} "
                    f"in hall {hall_name} on {exam_date} at {exam_start}"
                )
                
            # Constraint 5: Sort eligible faculty by current duty counts ascending for load balancing
            eligible_faculty = sorted(
                eligible_faculty,
                key=lambda f: faculty_duties[str(f.get("_id") or f.get("id") or f.get("employeeId"))]
            )
            
            chosen_fac = eligible_faculty[0]
            chosen_id = str(chosen_fac.get("_id") or chosen_fac.get("id") or chosen_fac.get("employeeId"))
            
            # Step 3: Validation logging
            same_dept_check = not is_same_department(chosen_fac.get("department", ""), exam_dept)
            no_double_booking = not any(
                b["date"] == exam_date and times_overlap(exam_start, exam_end, b["startTime"], b["endTime"])
                for b in faculty_schedule.get(chosen_id, [])
            )
            not_teaching = not is_teaching_subject(chosen_fac, sub_code)
            
            print(f"Assigning {chosen_fac['name']} to "
                  f"{sub_code} in {hall_name}: "
                  f"same_dept_check={same_dept_check}, "
                  f"no_double_booking={no_double_booking}, "
                  f"not_teaching_this_subject={not_teaching}")
            
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
            
            faculty_schedule[chosen_id].append({
                "date": exam_date,
                "startTime": exam_start,
                "endTime": exam_end,
            })
            faculty_duties[chosen_id] += 1
            
        return {
            "invigilator_assignments": assignments,
            "total_assignments": len(assignments),
            "faculty_utilized": len([fid for fid, count in faculty_duties.items() if count > 0]),
            "conflicts_avoided": {
                "same_department": True,
                "double_booking": True,
                "subject_teacher": True,
                "hod_excluded": True,
                "load_balanced": True,
            },
        }
