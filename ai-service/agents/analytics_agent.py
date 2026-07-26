import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import traceback

class AnalyticsAgent:
    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        self.model_path = os.path.join(self.model_dir, 'slow_learner_model.pkl')
        self.scaler_path = os.path.join(self.model_dir, 'scaler.pkl')
        self.model = None
        self.scaler = None
        
    def _ensure_model_trained(self):
        """
        Loads the trained model and scaler, or trains a new one if not found.
        """
        if self.model is not None and self.scaler is not None:
            return

        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                return
            except Exception as e:
                print(f"Error loading model: {e}. Re-training model...")

        # Generate synthetic training data
        np.random.seed(42)
        synthetic_X = []
        synthetic_y = []

        for _ in range(500):
            sgpa = np.random.uniform(4.0, 10.0)
            avg_hist = np.random.uniform(4.0, 10.0)
            trend = np.random.choice([-1, 0, 1])
            fail_count = np.random.randint(0, 4)
            lowest_pct = np.random.uniform(20, 100)
            below_60 = np.random.randint(0, 6)
            
            features = [sgpa, avg_hist, trend, fail_count, lowest_pct, below_60]
            
            # Label based on VTU slow learner criteria
            is_slow = 1 if (
                sgpa < 6.0 or 
                fail_count > 0 or
                (avg_hist < 6.5 and trend == -1) or
                lowest_pct < 35
            ) else 0
            
            synthetic_X.append(features)
            synthetic_y.append(is_slow)

        # Train scaler & model
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(synthetic_X)

        self.model = LogisticRegression(
            random_state=42,
            max_iter=1000,
            C=1.0
        )
        self.model.fit(X_scaled, synthetic_y)

        # Save model for reuse
        os.makedirs(self.model_dir, exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        print("✓ Logistic Regression model trained and saved successfully.")

    def run(self, input_data: dict) -> dict:
        try:
            results = input_data.get("results", [])
            departments = input_data.get("departments", [])
            academic_year = input_data.get("academicYear", "")
            semester = input_data.get("semester", 1)

            # Ensure ML model is loaded
            self._ensure_model_trained()

            # --- SECTION A: STATISTICS ---
            
            # 1. Department-wise stats
            dept_wise_stats = []
            for dept in departments:
                dept_results = [r for r in results if r.get("department", "").strip().lower() == dept.strip().lower()]
                
                if not dept_results:
                    dept_wise_stats.append({
                        "department": dept,
                        "totalStudents": 0,
                        "passCount": 0,
                        "failCount": 0,
                        "passPercentage": 0.0,
                        "avgSGPA": 0.0,
                        "highestSGPA": 0.0,
                        "lowestSGPA": 0.0,
                        "topperUSN": "N/A",
                        "topperName": "N/A",
                        "topperSGPA": 0.0
                    })
                    continue

                total_students = len(dept_results)
                pass_count = sum(1 for r in dept_results if r.get("overallResult") == "PASS")
                fail_count = total_students - pass_count
                pass_pct = round((pass_count / total_students) * 100, 2)
                
                sgpas = [r.get("sgpa", 0.0) for r in dept_results]
                avg_sgpa = round(float(np.mean(sgpas)), 2)
                highest_sgpa = round(float(np.max(sgpas)), 2)
                lowest_sgpa = round(float(np.min(sgpas)), 2)

                # Find topper
                topper = max(dept_results, key=lambda x: (x.get("sgpa", 0.0), x.get("cgpa", 0.0)))
                
                dept_wise_stats.append({
                    "department": dept,
                    "totalStudents": total_students,
                    "passCount": pass_count,
                    "failCount": fail_count,
                    "passPercentage": pass_pct,
                    "avgSGPA": avg_sgpa,
                    "highestSGPA": highest_sgpa,
                    "lowestSGPA": lowest_sgpa,
                    "topperUSN": topper.get("usn", ""),
                    "topperName": topper.get("name", ""),
                    "topperSGPA": topper.get("sgpa", 0.0)
                })

            # 2. Subject-wise stats
            subject_map = {}
            for r in results:
                for sub in r.get("subjectResults", []):
                    code = sub.get("subjectCode")
                    if not code:
                        continue
                    if code not in subject_map:
                        subject_map[code] = {
                            "subjectCode": code,
                            "subjectName": sub.get("subjectName", ""),
                            "marks": [],
                            "percentages": [],
                            "grades": [],
                            "pass_count": 0,
                            "fail_count": 0
                        }
                    
                    marks_obtained = sub.get("marksObtained", 0.0)
                    percentage = sub.get("percentage", 0.0)
                    grade = sub.get("grade", "F")
                    is_passed = sub.get("isPassed", False)
                    
                    subject_map[code]["marks"].append(marks_obtained)
                    subject_map[code]["percentages"].append(percentage)
                    subject_map[code]["grades"].append(grade)
                    if is_passed:
                        subject_map[code]["pass_count"] += 1
                    else:
                        subject_map[code]["fail_count"] += 1

            subject_wise_stats = []
            for code, data in subject_map.items():
                total_appeared = len(data["marks"])
                pass_pct = round((data["pass_count"] / total_appeared) * 100, 2) if total_appeared > 0 else 0
                avg_marks = round(float(np.mean(data["marks"])), 2) if total_appeared > 0 else 0
                avg_pct = round(float(np.mean(data["percentages"])), 2) if total_appeared > 0 else 0
                highest_marks = round(float(np.max(data["marks"])), 2) if total_appeared > 0 else 0
                lowest_marks = round(float(np.min(data["marks"])), 2) if total_appeared > 0 else 0
                
                # Grade distribution
                grades_list = data["grades"]
                grade_dist = {
                    "O": grades_list.count("O"),
                    "A_plus": grades_list.count("A+") + grades_list.count("A_plus"),
                    "A": grades_list.count("A"),
                    "B_plus": grades_list.count("B+") + grades_list.count("B_plus"),
                    "B": grades_list.count("B"),
                    "C": grades_list.count("C"),
                    "P": grades_list.count("P"),
                    "F": grades_list.count("F")
                }

                subject_wise_stats.append({
                    "subjectCode": code,
                    "subjectName": data["subjectName"],
                    "totalAppeared": total_appeared,
                    "passCount": data["pass_count"],
                    "failCount": data["fail_count"],
                    "passPercentage": pass_pct,
                    "avgMarks": avg_marks,
                    "avgPercentage": avg_pct,
                    "gradeDistribution": grade_dist,
                    "highestMarks": highest_marks,
                    "lowestMarks": lowest_marks
                })

            # 3. Institution-wide toppers (Top 10)
            sorted_results = sorted(results, key=lambda x: (x.get("sgpa", 0.0), x.get("cgpa", 0.0)), reverse=True)
            institution_toppers = []
            for idx, r in enumerate(sorted_results[:10]):
                institution_toppers.append({
                    "rank": idx + 1,
                    "usn": r.get("usn", ""),
                    "name": r.get("name", ""),
                    "department": r.get("department", ""),
                    "semester": r.get("semester", semester),
                    "sgpa": r.get("sgpa", 0.0),
                    "cgpa": r.get("cgpa", 0.0)
                })

            # 4. Grade distribution (institution-wide)
            inst_grade_dist = {
                "O": 0, "A_plus": 0, "A": 0, "B_plus": 0, "B": 0, "C": 0, "P": 0, "F": 0
            }
            for sub_stat in subject_wise_stats:
                for k, v in sub_stat["gradeDistribution"].items():
                    inst_grade_dist[k] = inst_grade_dist.get(k, 0) + v

            # 5. Global Summary
            total_students = len(results)
            total_passed = sum(1 for r in results if r.get("overallResult") == "PASS")
            total_failed = total_students - total_passed
            inst_pass_pct = round((total_passed / total_students) * 100, 2) if total_students > 0 else 0.0
            
            all_sgpas = [r.get("sgpa", 0.0) for r in results]
            inst_avg_sgpa = round(float(np.mean(all_sgpas)), 2) if all_sgpas else 0.0
            highest_sgpa = round(float(np.max(all_sgpas)), 2) if all_sgpas else 0.0
            lowest_sgpa = round(float(np.min(all_sgpas)), 2) if all_sgpas else 0.0

            # --- SECTION B: SLOW LEARNER PREDICTION ---
            slow_learners = []
            if results:
                real_X = []
                for student in results:
                    hist = student.get("historicalSGPAs", [])
                    avg_hist = float(np.mean(hist)) if hist else 0.0
                    
                    if len(hist) >= 2:
                        trend = 1 if hist[-1] > np.mean(hist[:-1]) \
                                else (-1 if hist[-1] < np.mean(hist[:-1]) \
                                else 0)
                    else:
                        trend = 0
                    
                    fail_count = sum(1 for s in student.get("subjectResults", []) if not s.get("isPassed", False))
                    
                    percentages = [s.get("percentage", 0.0) for s in student.get("subjectResults", [])]
                    lowest_pct = min(percentages) if percentages else 0.0
                    
                    below_60 = sum(1 for s in student.get("subjectResults", []) if s.get("percentage", 0.0) < 60.0)
                    
                    real_X.append([
                        student.get("sgpa", 0.0),
                        avg_hist,
                        trend,
                        fail_count,
                        lowest_pct,
                        below_60
                    ])

                # Run predictions
                real_X_scaled = self.scaler.transform(real_X)
                predictions = self.model.predict(real_X_scaled)
                probabilities = self.model.predict_proba(real_X_scaled)

                for i, student in enumerate(results):
                    if predictions[i] == 1:
                        prob_val = float(probabilities[i][1])
                        
                        # Add human-readable reasons
                        reasons = []
                        if student.get("sgpa", 0.0) < 6.0:
                            reasons.append(f"Low SGPA: {student.get('sgpa')}")
                        
                        fail_subs = [s.get("subjectCode") for s in student.get("subjectResults", []) if not s.get("isPassed", False)]
                        if fail_subs:
                            reasons.append(f"Failed subjects: {', '.join(fail_subs)}")
                        
                        hist = student.get("historicalSGPAs", [])
                        if len(hist) >= 2:
                            if hist[-1] < hist[-2]:
                                reasons.append(f"Declining trend: {hist[-2]} → {hist[-1]}")

                        slow_learners.append({
                            "studentId": student.get("studentId"),
                            "usn": student.get("usn"),
                            "name": student.get("name"),
                            "department": student.get("department"),
                            "semester": student.get("semester", semester),
                            "sgpa": student.get("sgpa"),
                            "riskProbability": round(prob_val * 100, 1),
                            "riskLevel": "High" if prob_val > 0.7 else "Medium" if prob_val > 0.4 else "Low",
                            "reasons": reasons
                        })

            return {
                "status": "SUCCESS",
                "statistics": {
                    "departmentWise": dept_wise_stats,
                    "subjectWise": subject_wise_stats,
                    "institutionToppers": institution_toppers,
                    "gradeDistribution": inst_grade_dist,
                    "summary": {
                        "totalStudents": total_students,
                        "totalPassed": total_passed,
                        "totalFailed": total_failed,
                        "institutionPassPercentage": inst_pass_pct,
                        "institutionAvgSGPA": inst_avg_sgpa,
                        "highestSGPA": highest_sgpa,
                        "lowestSGPA": lowest_sgpa
                    }
                },
                "slowLearners": slow_learners,
                "slowLearnerCount": len(slow_learners),
                "modelInfo": {
                    "algorithm": "Logistic Regression",
                    "trainingDataSize": 500,
                    "featuresUsed": [
                        "current_sgpa",
                        "avg_historical_sgpa", 
                        "sgpa_trend",
                        "fail_subject_count",
                        "lowest_subject_percentage",
                        "below_60_count"
                    ],
                    "note": "Model trained on synthetic data based on VTU grading criteria"
                }
            }

        except Exception as e:
            return {
                "status": "FAILED",
                "error": str(e),
                "traceback": traceback.format_exc()
            }
