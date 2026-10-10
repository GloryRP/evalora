"""
Scheduling Agent
Handles exam scheduling with sequential calendar days (skipping weekends) starting from a start date.
Supports up to 2 sessions per day (Morning & Afternoon) to allow 2 exams per day.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any


class SchedulingAgent:
    """
    Schedules exams based on subjects and constraints
    Schedules up to 2 exams per day (Morning and Afternoon) on consecutive weekdays starting from a start date
    """
    
    def __init__(self):
        self.name = "scheduling_agent"
    
    def run(self, subjects: List[Dict], start_date: str, exam_category: str, component: str, constraints: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Schedule exams sequentially starting from start_date (max 2 per day)
        
        Args:
            subjects: List of subject dictionaries
            start_date: Start date string (YYYY-MM-DD)
            exam_category: "internal1", "internal2", "external"
            component: "theory", "lab", "both"
            constraints: Dict with custom settings
        
        Returns:
            Dict with scheduled_exams list and metadata
        """
        if not subjects:
            return {"scheduled_exams": [], "message": "No subjects provided"}
        if not start_date:
            return {"scheduled_exams": [], "message": "No start date provided"}
            
        constraints = constraints or {}
        
        # Default constraints
        min_gap = constraints.get("minGapBetweenExams", 1)
        max_per_day = constraints.get("maxExamsPerDay", 3)
        
        morning_start = constraints.get("theoryStartTime") or constraints.get("morningStartTime") or "09:00"
        afternoon_start = constraints.get("afternoonStartTime") or constraints.get("labStartTime") or "13:30"
        
        internal_duration = float(constraints.get("internalDuration", 1.5))
        external_duration = float(constraints.get("externalDuration", 3.0))
        lab_duration = float(constraints.get("labDuration", 3.0))

        # Parse start date
        try:
            clean_str = start_date.split('T')[0]
            base_date = datetime.strptime(clean_str, "%Y-%m-%d").date()
        except Exception as e:
            print(f"Error parsing date {start_date}: {e}")
            base_date = datetime.now().date()

        def needs_theory_exam(sub, cat):
            config = sub.get("examConfig") or {}
            t_type = sub.get("subjectType", "theory")
            if t_type == "lab":
                return False
            if cat == "internal1":
                return config.get("theoryInternals", 2) >= 1
            if cat == "internal2":
                return config.get("theoryInternals", 2) >= 2
            if cat == "external":
                return config.get("theoryExternal", True)
            return False

        def needs_lab_exam(sub, cat):
            config = sub.get("examConfig") or {}
            t_type = sub.get("subjectType", "theory")
            if t_type == "theory":
                return False
            if cat == "internal1":
                return config.get("labInternals", 0) >= 1
            if cat == "internal2":
                return config.get("labInternals", 0) >= 2
            if cat == "external":
                return config.get("labExternal", False)
            return False

        def add_hours_to_time(time_str, hours):
            try:
                h, m = map(int, time_str.split(':'))
                total_minutes = int(h * 60 + m + hours * 60)
                new_h = (total_minutes // 60) % 24
                new_m = total_minutes % 60
                return f"{new_h:02d}:{new_m:02d}"
            except Exception:
                return time_str

        # Generate schedulable entities (only for valid subjects with non-empty subjectCode)
        schedulable_entities = []
        for sub in subjects:
            code = (sub.get("subjectCode") or "").strip()
            if not code:
                continue
            if component in ["theory", "both"] and needs_theory_exam(sub, exam_category):
                schedulable_entities.append({
                    "subject": sub,
                    "component_type": "theory"
                })
            if component in ["lab", "both"] and needs_lab_exam(sub, exam_category):
                schedulable_entities.append({
                    "subject": sub,
                    "component_type": "lab"
                })
                
        # Sort entities by semester (ascending) and credits (descending)
        schedulable_entities = sorted(
            schedulable_entities,
            key=lambda e: (e["subject"].get("semester", 1), -e["subject"].get("credits", 3))
        )

        scheduled_exams = []
        semester_slot_pointer = {}
        scheduled_entity_keys = set()
        
        for entity in schedulable_entities:
            sub = entity["subject"]
            comp_type = entity["component_type"]
            sem = sub.get("semester", 1)
            sub_code = (sub.get("subjectCode") or "").strip()
            subject_id = str(sub.get("_id") or sub.get("id") or "")

            # Prevent duplicate scheduling of the exact same subject entity
            entity_key = f"{subject_id}_{comp_type}"
            if entity_key in scheduled_entity_keys:
                print(f"[SCHEDULING AGENT] Skipping already scheduled entity: {sub_code} ({comp_type})")
                continue
            
            if sem not in semester_slot_pointer:
                semester_slot_pointer[sem] = {
                    "date": base_date,
                    "session": "morning"
                }
                
            slot_info = semester_slot_pointer[sem]
            curr_date = slot_info["date"]
            session = slot_info["session"]
            
            # Find next available weekday if date is a weekend
            while curr_date.weekday() >= 5:
                curr_date += timedelta(days=1)
                
            # Assign start time and duration
            if session == "morning":
                start_time = morning_start
                duration = internal_duration if exam_category.startswith("internal") else external_duration
                if comp_type == "lab":
                    duration = lab_duration
                # Next session for this sem is afternoon on the SAME day
                next_date = curr_date
                next_session = "afternoon"
            else:  # afternoon
                start_time = afternoon_start
                duration = internal_duration if exam_category.startswith("internal") else external_duration
                if comp_type == "lab":
                    duration = lab_duration
                # Next session for this sem is morning on the NEXT day
                next_date = curr_date + timedelta(days=1)
                next_session = "morning"
                
            end_time = add_hours_to_time(start_time, duration)
            
            exam = {
                "subjectId": subject_id,
                "subjectCode": sub_code,
                "subjectName": sub.get("subjectName", ""),
                "examDate": curr_date.isoformat(),
                "startTime": start_time,
                "endTime": end_time,
                "semester": sem,
                "examType": exam_category,
                "componentType": comp_type,
                "department": sub.get("department", ""),
            }
            
            scheduled_exams.append(exam)
            scheduled_entity_keys.add(entity_key)
            
            # Update state pointer
            semester_slot_pointer[sem] = {
                "date": next_date,
                "session": next_session
            }

        # Detailed logging before returning schedule
        print("\n=== SCHEDULING AGENT FINAL SCHEDULE OUTPUT ===")
        print(f"Total exams scheduled: {len(scheduled_exams)}")
        for idx, ex in enumerate(scheduled_exams, start=1):
            print(f"  [{idx}] Date: {ex['examDate']} | Time: {ex['startTime']}-{ex['endTime']} | Code: '{ex['subjectCode']}' | Subject: '{ex['subjectName']}' | Dept: '{ex['department']}' | Sem: {ex['semester']} | Type: {ex['componentType']}")
        print("==============================================\n")
                
        return {
            "scheduled_exams": scheduled_exams,
            "total_exams": len(scheduled_exams),
            "start_date": base_date.isoformat(),
            "constraints_applied": {
                "minGapBetweenExams": min_gap,
                "maxExamsPerDay": max_per_day,
            },
        }
