"""
ML Evaluation and GPA Agent Audit Script
1. Evaluates Slow-Learner Logistic Regression ML Model on an 80/20 held-out split:
   - Accuracy, Precision, Recall, F1 Score
   - Confusion Matrix
   - Feature Importances (coefficients)
2. Performs independent ground-truth GPA/SGPA/CGPA calculations for 5 test students
   and cross-validates against system output.
3. Generates /audit/ml-evaluation.md
"""
import os
import sys
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Add ai-service to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ai-service')))
from agents.gpa_agent import GPAAgent

def run_ml_evaluation():
    print("=== EVALUATING SLOW-LEARNER ML MODEL ===")
    
    # Replicate synthetic dataset generation from analytics_agent.py
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
        
        # Ground truth label based on VTU slow learner criteria from analytics_agent.py
        is_slow = 1 if (
            sgpa < 6.0 or 
            fail_count > 0 or
            (avg_hist < 6.5 and trend == -1) or
            lowest_pct < 35
        ) else 0
        
        synthetic_X.append(features)
        synthetic_y.append(is_slow)

    X = np.array(synthetic_X)
    y = np.array(synthetic_y)

    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(random_state=42, max_iter=1000, C=1.0)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    feature_names = ["sgpa", "avg_hist", "trend", "fail_count", "lowest_pct", "below_60"]
    coefficients = dict(zip(feature_names, model.coef_[0]))

    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"Confusion Matrix:\n{cm}")

    return {
        "dataset_size": 500,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "confusion_matrix": cm,
        "coefficients": coefficients
    }


def run_gpa_validation():
    print("\n=== VALIDATING GPA CALCULATION AGENT (INDEPENDENT GROUND TRUTH) ===")
    gpa_agent = GPAAgent()

    # Define standard VTU grading scale
    # 90-100: O (10)
    # 80-89: A+ (9)
    # 70-79: A (8)
    # 60-69: B+ (7)
    # 55-59: B (6)
    # 50-54: C (5)
    # 40-49: P (4)
    # <40: F (0)

    test_students = [
        {
            "id": "CASE-1-HIGH",
            "name": "High Achiever (All >80%)",
            "semester": 5,
            "subjects": [
                {"code": "CS501", "marks": 85, "max": 100, "credits": 4}, # 85% -> A+ (9) -> 36
                {"code": "CS502", "marks": 92, "max": 100, "credits": 4}, # 92% -> O (10) -> 40
                {"code": "CS503", "marks": 78, "max": 100, "credits": 3}, # 78% -> A (8) -> 24
            ],
            # Total credits: 11. Points: 36+40+24 = 100. Expected SGPA: 100 / 11 = 9.09
            "expected_sgpa": round(100 / 11, 2)
        },
        {
            "id": "CASE-2-FAIL",
            "name": "Student with One Failed Subject (<40)",
            "semester": 5,
            "subjects": [
                {"code": "CS501", "marks": 32, "max": 100, "credits": 4}, # 32% -> F (0) -> 0
                {"code": "CS502", "marks": 65, "max": 100, "credits": 4}, # 65% -> B+ (7) -> 28
                {"code": "CS503", "marks": 55, "max": 100, "credits": 3}, # 55% -> B (6) -> 18
            ],
            # Total credits: 11. Points: 0 + 28 + 18 = 46. Expected SGPA: 46 / 11 = 4.18
            "expected_sgpa": round(46 / 11, 2)
        },
        {
            "id": "CASE-3-BOUNDARY",
            "name": "Exact Grade Boundary Values (40%, 60%, 80%)",
            "semester": 5,
            "subjects": [
                {"code": "CS501", "marks": 40, "max": 100, "credits": 4}, # Exactly 40% -> P (4) -> 16
                {"code": "CS502", "marks": 60, "max": 100, "credits": 4}, # Exactly 60% -> B+ (7) -> 28
                {"code": "CS503", "marks": 80, "max": 100, "credits": 4}, # Exactly 80% -> A+ (9) -> 36
            ],
            # Total credits: 12. Points: 16+28+36 = 80. Expected SGPA: 80 / 12 = 6.67
            "expected_sgpa": round(80 / 12, 2)
        },
        {
            "id": "CASE-4-LAB-THEORY",
            "name": "Mixed Lab and Theory Subject Credits",
            "semester": 5,
            "subjects": [
                {"code": "CS501", "marks": 70, "max": 100, "credits": 4}, # 70% -> A (8) -> 32
                {"code": "CSL507", "marks": 45, "max": 50, "credits": 2},  # 45/50 = 90% -> O (10) -> 20
            ],
            # Total credits: 6. Points: 32 + 20 = 52. Expected SGPA: 52 / 6 = 8.67
            "expected_sgpa": round(52 / 6, 2)
        },
        {
            "id": "CASE-5-ZERO",
            "name": "Script with Zero Marks",
            "semester": 5,
            "subjects": [
                {"code": "CS501", "marks": 0, "max": 100, "credits": 4},  # 0% -> F (0) -> 0
                {"code": "CS502", "marks": 50, "max": 100, "credits": 4}, # 50% -> C (5) -> 20
            ],
            # Total credits: 8. Points: 0 + 20 = 20. Expected SGPA: 20 / 8 = 2.50
            "expected_sgpa": round(20 / 8, 2)
        }
    ]

    vtu_grading_scheme = [
        {"minPercentage": 90.0, "maxPercentage": 100.0, "grade": "O", "gradePoint": 10.0, "description": "Outstanding"},
        {"minPercentage": 80.0, "maxPercentage": 89.99, "grade": "A+", "gradePoint": 9.0, "description": "Excellent"},
        {"minPercentage": 70.0, "maxPercentage": 79.99, "grade": "A", "gradePoint": 8.0, "description": "Very Good"},
        {"minPercentage": 60.0, "maxPercentage": 69.99, "grade": "B+", "gradePoint": 7.0, "description": "Good"},
        {"minPercentage": 55.0, "maxPercentage": 59.99, "grade": "B", "gradePoint": 6.0, "description": "Above Average"},
        {"minPercentage": 50.0, "maxPercentage": 54.99, "grade": "C", "gradePoint": 5.0, "description": "Average"},
        {"minPercentage": 40.0, "maxPercentage": 49.99, "grade": "P", "gradePoint": 4.0, "description": "Pass"},
        {"minPercentage": 0.0, "maxPercentage": 39.99, "grade": "F", "gradePoint": 0.0, "description": "Fail"},
    ]

    gpa_results = []
    for s in test_students:
        payload = {
            "students": [
                {
                    "studentId": s["id"],
                    "usn": f"USN-{s['id']}",
                    "name": s["name"],
                    "department": "Computer Science",
                    "semester": s["semester"],
                    "subjects": [
                        {
                            "subjectCode": sub["code"],
                            "marksObtained": float(sub["marks"]),
                            "maxMarks": float(sub["max"]),
                            "credits": sub["credits"]
                        } for sub in s["subjects"]
                    ]
                }
            ],
            "gradingScheme": vtu_grading_scheme,
            "passMarkPercentage": 40.0
        }
        output = gpa_agent.run(payload)
        system_res = output.get("results", [{}])[0]
        actual_sgpa = system_res.get("sgpa")
        
        diff = abs(actual_sgpa - s["expected_sgpa"]) if actual_sgpa is not None else 999
        status = "PASS" if diff <= 0.05 else "FAIL"

        print(f"[{status}] {s['id']}: Expected SGPA = {s['expected_sgpa']}, System SGPA = {actual_sgpa}")
        gpa_results.append({
            "id": s["id"],
            "name": s["name"],
            "expected": s["expected_sgpa"],
            "actual": actual_sgpa,
            "status": status,
            "subjects": s["subjects"]
        })

    return gpa_results


def generate_markdown(ml_res, gpa_res):
    cm = ml_res["confusion_matrix"]
    tn, fp, fn, tp = cm.ravel()

    md = f"""# Machine Learning & GPA Calculation Agent Evaluation

Generated: {pd.Timestamp.now().isoformat()}

## 1. Slow-Learner Prediction Model (Scikit-Learn)

### Model Specification
- **Algorithm**: `LogisticRegression(C=1.0, max_iter=1000, random_state=42)`
- **Preprocessing**: `StandardScaler` (Z-score normalization)
- **Data Source**: Synthetic generation within `analytics_agent.py` based on heuristic threshold rules
- **Dataset Size**: {ml_res["dataset_size"]} samples (Train: {ml_res["train_size"]}, Test: {ml_res["test_size"]})
- **Features Used ({len(ml_res["coefficients"])} total)**:
  1. `sgpa`: Semester Grade Point Average
  2. `avg_hist`: Historical CGPA/average
  3. `trend`: Direction of performance change (-1 = declining, 0 = stable, +1 = improving)
  4. `fail_count`: Number of backlogs/failed subjects in the semester
  5. `lowest_pct`: Minimum subject percentage obtained
  6. `below_60`: Count of subjects scoring below 60%

### Evaluation Metrics (Held-out 20% Test Split)

| Metric | Score | Performance Assessment |
|---|---|---|
| **Accuracy** | **{ml_res["accuracy"] * 100:.2f}%** | Overall classification correctness |
| **Precision** | **{ml_res["precision"] * 100:.2f}%** | Proportion of predicted slow learners who are truly at-risk |
| **Recall** | **{ml_res["recall"] * 100:.2f}%** | Proportion of at-risk students successfully identified |
| **F1 Score** | **{ml_res["f1"] * 100:.2f}%** | Harmonic balance between Precision and Recall |

### Confusion Matrix

| | Predicted Normal (0) | Predicted Slow Learner (1) |
|---|---|---|
| **Actual Normal (0)** | **TN = {tn}** | **FP = {fp}** |
| **Actual Slow Learner (1)** | **FN = {fn}** | **TP = {tp}** |

### Feature Coefficients (Model Importance)

| Feature | Coefficient | Influence on Slow Learner Risk |
|---|---|---|
"""
    for feat, coef in sorted(ml_res["coefficients"].items(), key=lambda x: abs(x[1]), reverse=True):
        direction = "🔺 Increases Risk" if coef > 0 else "🔻 Decreases Risk"
        md += f"| `{feat}` | `{coef:.4f}` | {direction} |\n"

    md += """
---

## 2. GPA Calculation Agent Verification (Ground-Truth Comparison)

Formulas verified:
- $\\text{Percentage} = \\frac{\\text{Marks Obtained}}{\\text{Max Marks}} \\times 100$
- $\\text{SGPA} = \\frac{\\sum (\\text{Grade Point} \\times \\text{Credits})}{\\sum \\text{Credits}}$
- Standard VTU 10-Point Scale: $\\ge 90\\%: 10, \\ge 80\\%: 9, \\ge 70\\%: 8, \\ge 60\\%: 7, \\ge 55\\%: 6, \\ge 50\\%: 5, \\ge 40\\%: 4, < 40\\%: 0$

### Test Case Results

| Test ID | Scenario Description | Hand Calculation SGPA | System Computed SGPA | Status |
|---|---|---|---|---|
"""
    for g in gpa_res:
        md += f"| `{g['id']}` | {g['name']} | **{g['expected']:.2f}** | **{g['actual']:.2f}** | {'✅ PASS' if g['status'] == 'PASS' else '❌ FAIL'} |\n"

    out_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml-evaluation.md'))
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(md)
    print(f"\nSaved ML evaluation report to: {out_path}")


if __name__ == "__main__":
    ml_res = run_ml_evaluation()
    gpa_res = run_gpa_validation()
    generate_markdown(ml_res, gpa_res)
