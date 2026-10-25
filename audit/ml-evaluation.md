# Machine Learning & GPA Calculation Agent Evaluation

Generated: 2026-10-10T18:40:50.668710

## 1. Slow-Learner Prediction Model (Scikit-Learn)

### Model Specification
- **Algorithm**: `LogisticRegression(C=1.0, max_iter=1000, random_state=42)`
- **Preprocessing**: `StandardScaler` (Z-score normalization)
- **Data Source**: Synthetic generation within `analytics_agent.py` based on heuristic threshold rules
- **Dataset Size**: 500 samples (Train: 400, Test: 100)
- **Features Used (6 total)**:
  1. `sgpa`: Semester Grade Point Average
  2. `avg_hist`: Historical CGPA/average
  3. `trend`: Direction of performance change (-1 = declining, 0 = stable, +1 = improving)
  4. `fail_count`: Number of backlogs/failed subjects in the semester
  5. `lowest_pct`: Minimum subject percentage obtained
  6. `below_60`: Count of subjects scoring below 60%

### Evaluation Metrics (Held-out 20% Test Split)

| Metric | Score | Performance Assessment |
|---|---|---|
| **Accuracy** | **91.00%** | Overall classification correctness |
| **Precision** | **93.41%** | Proportion of predicted slow learners who are truly at-risk |
| **Recall** | **96.59%** | Proportion of at-risk students successfully identified |
| **F1 Score** | **94.97%** | Harmonic balance between Precision and Recall |

### Confusion Matrix

| | Predicted Normal (0) | Predicted Slow Learner (1) |
|---|---|---|
| **Actual Normal (0)** | **TN = 6** | **FP = 6** |
| **Actual Slow Learner (1)** | **FN = 3** | **TP = 85** |

### Feature Coefficients (Model Importance)

| Feature | Coefficient | Influence on Slow Learner Risk |
|---|---|---|
| `fail_count` | `3.7152` | 🔺 Increases Risk |
| `sgpa` | `-1.2092` | 🔻 Decreases Risk |
| `lowest_pct` | `-0.5480` | 🔻 Decreases Risk |
| `avg_hist` | `-0.2292` | 🔻 Decreases Risk |
| `below_60` | `-0.0832` | 🔻 Decreases Risk |
| `trend` | `-0.0558` | 🔻 Decreases Risk |

---

## 2. GPA Calculation Agent Verification (Ground-Truth Comparison)

Formulas verified:
- $\text{Percentage} = \frac{\text{Marks Obtained}}{\text{Max Marks}} \times 100$
- $\text{SGPA} = \frac{\sum (\text{Grade Point} \times \text{Credits})}{\sum \text{Credits}}$
- Standard VTU 10-Point Scale: $\ge 90\%: 10, \ge 80\%: 9, \ge 70\%: 8, \ge 60\%: 7, \ge 55\%: 6, \ge 50\%: 5, \ge 40\%: 4, < 40\%: 0$

### Test Case Results

| Test ID | Scenario Description | Hand Calculation SGPA | System Computed SGPA | Status |
|---|---|---|---|---|
| `CASE-1-HIGH` | High Achiever (All >80%) | **9.09** | **9.09** | ✅ PASS |
| `CASE-2-FAIL` | Student with One Failed Subject (<40) | **4.18** | **4.18** | ✅ PASS |
| `CASE-3-BOUNDARY` | Exact Grade Boundary Values (40%, 60%, 80%) | **6.67** | **6.67** | ✅ PASS |
| `CASE-4-LAB-THEORY` | Mixed Lab and Theory Subject Credits | **8.67** | **8.67** | ✅ PASS |
| `CASE-5-ZERO` | Script with Zero Marks | **2.50** | **2.50** | ✅ PASS |
