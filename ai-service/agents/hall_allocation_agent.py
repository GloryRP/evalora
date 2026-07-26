"""
Hall Allocation Agent
Allocates students to exam halls with 2-per-bench mixed-subject/department spacing.
"""
from typing import List, Dict, Any
import math


class HallAllocationAgent:
    """
    Allocates students to halls for exams in pairs on benches.
    Ensures adjacent students are from different departments / writing different papers.
    """
    
    def __init__(self):
        self.name = "hall_allocation_agent"
    
    def run(self, exams: List[Dict], students: List[Dict], halls: List[Dict], constraints: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Allocate students to halls for each exam session
        
        Args:
            exams: List of scheduled exams
            students: List of all students
            halls: List of available halls
            constraints: Dict with custom settings
        
        Returns:
            Dict with hall_allocations list and metadata
        """
        if not exams or not students or not halls:
            return {"hall_allocations": [], "message": "Missing required data"}
        
        # Group exams by date and time slot (representing unique exam sessions)
        sessions = {}
        for exam in exams:
            # Key: (date, startTime, endTime)
            key = (exam.get("examDate"), exam.get("startTime"), exam.get("endTime"))
            if key not in sessions:
                sessions[key] = []
            sessions[key].append(exam)
            
        allocations = []
        halls_used_all_sessions = set()
        
        # Process each exam session independently
        for session_key, session_exams in sessions.items():
            session_date, session_start, session_end = session_key
            
            # Group eligible students for this session by (department, subjectCode, examId)
            student_pools = []
            for exam in session_exams:
                exam_sem = exam.get("semester")
                exam_dept = exam.get("department")
                sub_code = exam.get("subjectCode")
                exam_id = exam.get("_id") or exam.get("id") or exam.get("subjectId")
                
                # Filter students for this exam's semester & department
                eligible = [s for s in students if s.get("semester") == exam_sem and s.get("department") == exam_dept]
                
                # Fallback: if no department-specific students, filter by semester
                if not eligible:
                    eligible = [s for s in students if s.get("semester") == exam_sem]
                    
                if eligible:
                    # Make a copy of list so we don't mutate original inputs
                    student_pools.append({
                        "department": exam_dept or "General",
                        "subjectCode": sub_code,
                        "examId": exam_id,
                        "students": list(eligible)
                    })
            
            # Sort halls by capacity (largest first)
            halls_sorted = sorted(halls, key=lambda h: h.get("capacity", 0), reverse=True)
            
            for hall in halls_sorted:
                # Check if we have any students left in any pool for this session
                total_left = sum(len(p["students"]) for p in student_pools)
                if total_left == 0:
                    break
                    
                hall_capacity = hall.get("capacity", 40)
                hall_id = hall.get("_id") or hall.get("id")
                hall_name = hall.get("hallName", "")
                
                # 2 students per bench
                num_benches = hall_capacity // 2
                seat_number = 1
                
                for bench_num in range(1, num_benches + 1):
                    # Check remaining students
                    total_left = sum(len(p["students"]) for p in student_pools)
                    if total_left == 0:
                        break
                        
                    # 1. Allocate Left Seat on the Bench
                    # Sort pools by remaining student count descending to distribute evenly
                    pools = sorted(
                        [p for p in student_pools if p["students"]],
                        key=lambda p: len(p["students"]),
                        reverse=True
                    )
                    if not pools:
                        break
                        
                    left_pool = pools[0]
                    left_student = left_pool["students"].pop(0)
                    left_student_id = left_student.get("_id") or left_student.get("id")
                    
                    allocations.append({
                        "examId": left_pool["examId"],
                        "hallId": hall_id,
                        "studentId": left_student_id,
                        "seatNumber": seat_number,
                        "benchNumber": bench_num,
                        "seatPosition": "left",
                        "hallName": hall_name,
                        "studentUSN": left_student.get("usn", ""),
                        "subjectCode": left_pool["subjectCode"]
                    })
                    halls_used_all_sessions.add(hall_id)
                    seat_number += 1
                    
                    # 2. Allocate Right Seat on the Bench
                    # Re-sort remaining pools
                    pools = sorted(
                        [p for p in student_pools if p["students"]],
                        key=lambda p: len(p["students"]),
                        reverse=True
                    )
                    if not pools:
                        continue
                        
                    right_pool = None
                    # Try different department & paper first
                    for p in pools:
                        if p["department"] != left_pool["department"] and p["subjectCode"] != left_pool["subjectCode"]:
                            right_pool = p
                            break
                            
                    # Fallback 1: different paper, same department
                    if not right_pool:
                        for p in pools:
                            if p["subjectCode"] != left_pool["subjectCode"]:
                                right_pool = p
                                break
                                
                    # Fallback 2: same paper, same department (exceptional case)
                    if not right_pool:
                        right_pool = pools[0]
                        
                    if right_pool:
                        right_student = right_pool["students"].pop(0)
                        right_student_id = right_student.get("_id") or right_student.get("id")
                        
                        allocations.append({
                            "examId": right_pool["examId"],
                            "hallId": hall_id,
                            "studentId": right_student_id,
                            "seatNumber": seat_number,
                            "benchNumber": bench_num,
                            "seatPosition": "right",
                            "hallName": hall_name,
                            "studentUSN": right_student.get("usn", ""),
                            "subjectCode": right_pool["subjectCode"]
                        })
                        seat_number += 1
                
                # Check for odd capacity last seat
                if hall_capacity % 2 == 1:
                    total_left = sum(len(p["students"]) for p in student_pools)
                    if total_left > 0:
                        pools = sorted(
                            [p for p in student_pools if p["students"]],
                            key=lambda p: len(p["students"]),
                            reverse=True
                        )
                        if pools:
                            last_pool = pools[0]
                            last_student = last_pool["students"].pop(0)
                            last_student_id = last_student.get("_id") or last_student.get("id")
                            
                            allocations.append({
                                "examId": last_pool["examId"],
                                "hallId": hall_id,
                                "studentId": last_student_id,
                                "seatNumber": seat_number,
                                "benchNumber": num_benches + 1,
                                "seatPosition": "left",
                                "hallName": hall_name,
                                "studentUSN": last_student.get("usn", ""),
                                "subjectCode": last_pool["subjectCode"]
                            })
                            halls_used_all_sessions.add(hall_id)
                            seat_number += 1
                            
        return {
            "hall_allocations": allocations,
            "total_allocations": len(allocations),
            "halls_used": len(halls_used_all_sessions)
        }
