import traceback

class GPAAgent:
    def run(self, input_data: dict) -> dict:
        """
        Input: {
          students: [
            {
              studentId: str,
              usn: str,
              name: str,
              semester: int,
              department: str,
              subjects: [
                {
                  examId: str,
                  subjectId: str,
                  subjectCode: str,
                  subjectName: str,
                  credits: int,
                  maxMarks: float,
                  marksObtained: float
                }
              ]
            }
          ],
          gradingScheme: [
            {
              minPercentage: float,
              maxPercentage: float,
              grade: str,
              gradePoint: float,
              description: str
            }
          ],
          passMarkPercentage: float
        }
        """
        try:
            students = input_data.get("students", [])
            grading_scheme = input_data.get("gradingScheme", [])
            pass_mark_pct = input_data.get("passMarkPercentage", 40.0)
            
            results = []
            total_sgpa = 0.0
            highest_sgpa = -1.0
            lowest_sgpa = 11.0
            pass_count = 0
            fail_count = 0

            for student in students:
                subject_results = []
                total_credits = 0.0
                total_grade_points = 0.0
                student_failed = False

                for sub in student.get("subjects", []):
                    marks_obtained = sub.get("marksObtained", 0.0)
                    max_marks = sub.get("maxMarks", 100.0)
                    credits = sub.get("credits", 4)

                    # 1. Compute percentage
                    if max_marks > 0:
                        percentage = (marks_obtained / max_marks) * 100.0
                    else:
                        percentage = 0.0
                    percentage = round(percentage, 2)

                    # 2. Determine grade from gradingScheme
                    grade = "F"
                    grade_point = 0.0
                    for entry in grading_scheme:
                        min_pct = entry.get("minPercentage", 0.0)
                        max_pct = entry.get("maxPercentage", 100.0)
                        if percentage >= min_pct and percentage <= max_pct:
                            grade = entry.get("grade", "F")
                            grade_point = entry.get("gradePoint", 0.0)
                            break

                    # 3. Compute gradePointsEarned
                    grade_points_earned = grade_point * credits

                    # 4. Determine isPassed
                    is_passed = percentage >= pass_mark_pct
                    if not is_passed or grade == "F":
                        student_failed = True

                    subject_results.append({
                        "examId": sub.get("examId"),
                        "subjectId": sub.get("subjectId"),
                        "subjectCode": sub.get("subjectCode"),
                        "subjectName": sub.get("subjectName"),
                        "credits": credits,
                        "maxMarks": max_marks,
                        "marksObtained": marks_obtained,
                        "percentage": percentage,
                        "grade": grade,
                        "gradePoint": grade_point,
                        "gradePointsEarned": grade_points_earned,
                        "isPassed": is_passed,
                        "result": "PASS" if is_passed else "FAIL"
                    })

                    total_credits += credits
                    total_grade_points += grade_points_earned

                # Compute SGPA
                if total_credits > 0:
                    sgpa = total_grade_points / total_credits
                else:
                    sgpa = 0.0
                sgpa = round(sgpa, 2)

                overall_result = "FAIL" if student_failed else "PASS"
                if overall_result == "PASS":
                    pass_count += 1
                else:
                    fail_count += 1

                if sgpa > highest_sgpa:
                    highest_sgpa = sgpa
                if sgpa < lowest_sgpa:
                    lowest_sgpa = sgpa

                total_sgpa += sgpa

                results.append({
                    "studentId": student.get("studentId"),
                    "usn": student.get("usn"),
                    "name": student.get("name"),
                    "semester": student.get("semester"),
                    "department": student.get("department"),
                    "subjectResults": subject_results,
                    "totalCredits": total_credits,
                    "totalGradePoints": total_grade_points,
                    "sgpa": sgpa,
                    "overallResult": overall_result
                })

            total_students = len(students)
            class_avg_sgpa = 0.0
            if total_students > 0:
                class_avg_sgpa = round(total_sgpa / total_students, 2)
            
            if highest_sgpa < 0:
                highest_sgpa = 0.0
            if lowest_sgpa > 10.0:
                lowest_sgpa = 0.0

            return {
                "status": "SUCCESS",
                "results": results,
                "summary": {
                    "totalStudents": total_students,
                    "passCount": pass_count,
                    "failCount": fail_count,
                    "classAvgSGPA": class_avg_sgpa,
                    "highestSGPA": highest_sgpa,
                    "lowestSGPA": lowest_sgpa
                }
            }
        except Exception as e:
            return {
                "status": "FAILED",
                "error": str(e),
                "traceback": traceback.format_exc()
            }
