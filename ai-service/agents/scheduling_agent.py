"""
Scheduling Agent
Handles exam scheduling with sequential calendar days (skipping weekends) starting from a start date.
Supports up to 2 sessions per day (Morning & Afternoon) to allow 2 exams per day.

F5: Same-semester date constraint — no two exams of the same semester may be on dates
    closer than minGapBetweenExams days apart (default 1, i.e., no same-date clashes).
    Exams of different semesters may freely share a date in different sessions.
F6: startDate is required — raises ValueError instead of silently falling back to today.
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
            start_date: Start date string (YYYY-MM-DD) — REQUIRED; raises ValueError if missing
            exam_category: "internal1", "internal2", "external"
            component: "theory", "lab", "both"
            constraints: Dict with custom settings
        
        Returns:
            Dict with scheduled_exams list and metadata
        """
        if not subjects:
            return {"scheduled_exams": [], "message": "No subjects provided"}

        # F6: startDate is required — no silent fallback
        if not start_date or not start_date.strip():
            raise ValueError("startDate is required and cannot be empty.")
            
        constraints = constraints or {}
        
        # Default constraints
        # F5: minGapBetweenExams = minimum calendar days between consecutive exams of the SAME semester
        min_gap = int(constraints.get("minGapBetweenExams", 1))
        max_per_day = constraints.get("maxExamsPerDay", 3)
        end_date_str = constraints.get("endDate")
        
        morning_start = constraints.get("theoryStartTime") or constraints.get("morningStartTime") or "09:00"
        afternoon_start = constraints.get("afternoonStartTime") or constraints.get("labStartTime") or "13:30"
        
        internal_duration = float(constraints.get("internalDuration", 1.5))
        external_duration = float(constraints.get("externalDuration", 3.0))
        lab_duration = float(constraints.get("labDuration", 3.0))

        # F6: Parse start date — raise ValueError on parse failure (no fallback)
        try:
            clean_str = start_date.split('T')[0]
            base_date = datetime.strptime(clean_str, "%Y-%m-%d").date()
        except Exception as e:
            raise ValueError(f"Invalid startDate '{start_date}': {e}. Expected format: YYYY-MM-DD.")

        # Parse optional endDate for conflict detection
        end_date = None
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str.split('T')[0], "%Y-%m-%d").date()
            except Exception:
                pass  # endDate parse failure is non-fatal; conflict won't be detected

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

        # Parse excluded dates / holidays if provided
        excluded_dates_raw = constraints.get("excludedDates") or constraints.get("excluded_dates") or constraints.get("holidays") or []
        excluded_dates = set()
        for ed in excluded_dates_raw:
            try:
                if isinstance(ed, str):
                    excluded_dates.add(datetime.strptime(ed.split('T')[0], "%Y-%m-%d").date())
            except Exception:
                pass

        def is_valid_exam_date(d):
            # Skip weekends (Saturday=5, Sunday=6)
            if d.weekday() >= 5:
                return False
            # Skip user-specified excluded dates and holidays
            if d in excluded_dates:
                return False
            return True

        def next_valid_date(d):
            """Skip weekends, Sundays, holidays, and excluded dates."""
            while not is_valid_exam_date(d):
                d += timedelta(days=1)
            return d

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
        scheduled_entity_keys = set()

        # F5: Enforce same-semester gap and no two exams of the same semester on the same date.
        # Track last scheduled date per semester.
        semester_last_date = {}
        # Track sessions occupied per date across all semesters: date -> {"morning": sem, "afternoon": sem}
        date_sessions = {}

        effective_gap = max(1, min_gap)

        for entity in schedulable_entities:
            sub = entity["subject"]
            comp_type = entity["component_type"]
            sem = sub.get("semester", 1)
            sub_code = (sub.get("subjectCode") or "").strip()
            subject_id = str(sub.get("_id") or sub.get("id") or "")

            # Prevent duplicate scheduling of the exact same subject entity
            entity_key = f"{subject_id or sub_code}_{comp_type}"
            if entity_key in scheduled_entity_keys:
                print(f"[SCHEDULING AGENT] Skipping already scheduled entity: {sub_code} ({comp_type})")
                continue

            # Earliest possible candidate date for this semester:
            # - If this semester already has an exam, must be at least effective_gap days later
            # - Otherwise starts from base_date
            if sem in semester_last_date:
                candidate_date = next_valid_date(semester_last_date[sem] + timedelta(days=effective_gap))
            else:
                candidate_date = next_valid_date(base_date)

            # Find the earliest weekday and session available:
            # Different semesters may share the same date in different sessions (morning / afternoon).
            # Same semester never shares a date because candidate_date > semester_last_date[sem].
            scheduled_date = None
            assigned_session = None

            while True:
                candidate_date = next_valid_date(candidate_date)

                # F5: Conflict detection — if endDate is given and candidate_date exceeds it, report conflict
                if end_date and candidate_date > end_date:
                    raise ValueError(
                        f"Scheduling conflict: cannot fit subject '{sub_code}' (semester {sem}) "
                        f"within the given date range (up to {end_date.isoformat()}). "
                        f"Reduce the number of subjects, extend the end date, or reduce minGapBetweenExams."
                    )

                if candidate_date not in date_sessions:
                    date_sessions[candidate_date] = {}

                # Check morning session availability
                if "morning" not in date_sessions[candidate_date]:
                    scheduled_date = candidate_date
                    assigned_session = "morning"
                    date_sessions[candidate_date]["morning"] = sem
                    break
                # Check afternoon session availability (different semester sharing date)
                elif "afternoon" not in date_sessions[candidate_date]:
                    scheduled_date = candidate_date
                    assigned_session = "afternoon"
                    date_sessions[candidate_date]["afternoon"] = sem
                    break
                else:
                    # Both morning and afternoon occupied on candidate_date; move to next day
                    candidate_date = next_valid_date(candidate_date + timedelta(days=1))

            if assigned_session == "morning":
                start_time = morning_start
            else:
                start_time = afternoon_start

            duration = internal_duration if exam_category.startswith("internal") else external_duration
            if comp_type == "lab":
                duration = lab_duration

            end_time = add_hours_to_time(start_time, duration)

            exam = {
                "subjectId": subject_id,
                "subjectCode": sub_code,
                "subjectName": sub.get("subjectName", ""),
                "examDate": scheduled_date.isoformat(),
                "startTime": start_time,
                "endTime": end_time,
                "semester": sem,
                "examType": exam_category,
                "componentType": comp_type,
                "department": sub.get("department", ""),
            }

            scheduled_exams.append(exam)
            scheduled_entity_keys.add(entity_key)
            semester_last_date[sem] = scheduled_date

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
