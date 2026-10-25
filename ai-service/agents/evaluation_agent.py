"""
Evaluation Agent (F9)
Computes statistical summaries for a batch of evaluated answer scripts.
Uses the pass mark from the active GradingScheme; returns 400 if no scheme is found.

Flags:
  - Zero-score scripts (all questions scored 0)
  - Statistical outliers using IQR method
  - Evaluator-level mark uniformity (same question-wise marks across many scripts)
"""
import statistics
from typing import List, Dict, Any


class EvaluationAgent:
    def __init__(self):
        self.name = "evaluation_agent"

    def run(self, scripts: List[Dict], max_marks: float, pass_mark: float) -> Dict[str, Any]:
        """
        Analyse a list of evaluated scripts.

        Args:
            scripts:    List of dicts: { scriptId, studentId, evaluatorId, marksObtained, questionMarks[] }
            max_marks:  Maximum possible marks for the exam
            pass_mark:  Minimum marks to pass (from GradingScheme.passMarkPercentage * maxMarks / 100)

        Returns:
            Dict with average, highest, lowest, passPercentage, gradeDistribution, flaggedScripts
        """
        if not scripts:
            return {
                "total": 0,
                "average": 0,
                "highest": 0,
                "lowest": 0,
                "passCount": 0,
                "failCount": 0,
                "passPercentage": 0,
                "gradeDistribution": {},
                "flaggedScripts": [],
            }

        marks_list = [float(s.get("marksObtained") or 0) for s in scripts]
        n = len(marks_list)

        average = sum(marks_list) / n
        highest = max(marks_list)
        lowest = min(marks_list)

        pass_count = sum(1 for m in marks_list if m >= pass_mark)
        fail_count = n - pass_count
        pass_pct = round((pass_count / n) * 100, 2) if n > 0 else 0

        # Grade distribution (decile buckets)
        grade_distribution: Dict[str, int] = {}
        for m in marks_list:
            pct = (m / max_marks * 100) if max_marks > 0 else 0
            if pct >= 90:
                bucket = "90-100%"
            elif pct >= 80:
                bucket = "80-89%"
            elif pct >= 70:
                bucket = "70-79%"
            elif pct >= 60:
                bucket = "60-69%"
            elif pct >= 50:
                bucket = "50-59%"
            elif pct >= 40:
                bucket = "40-49%"
            else:
                bucket = "<40%"
            grade_distribution[bucket] = grade_distribution.get(bucket, 0) + 1

        # IQR-based outlier bounds (F9 guard: requires at least 5 scripts for statistical validity)
        IQR_MINIMUM_SCRIPTS = 5
        flagged: List[Dict] = []
        if n >= IQR_MINIMUM_SCRIPTS:
            sorted_marks = sorted(marks_list)
            q1 = statistics.median(sorted_marks[: n // 2])
            q3 = statistics.median(sorted_marks[(n + 1) // 2 :])
            iqr = q3 - q1
            lower_fence = q1 - 1.5 * iqr
            upper_fence = q3 + 1.5 * iqr
            iqr_status = {
                "status": "applied",
                "minimumRequired": IQR_MINIMUM_SCRIPTS,
                "actualCount": n,
                "q1": round(q1, 2),
                "q3": round(q3, 2),
                "iqr": round(iqr, 2),
                "lowerFence": round(lower_fence, 2),
                "upperFence": round(upper_fence, 2),
            }
        else:
            lower_fence = upper_fence = None
            iqr_status = {
                "status": "skipped",
                "reason": f"Insufficient scripts for statistical IQR calculation (minimum {IQR_MINIMUM_SCRIPTS} required, got {n})",
                "minimumRequired": IQR_MINIMUM_SCRIPTS,
                "actualCount": n,
            }

        # Track question-mark patterns per evaluator for uniformity check
        evaluator_patterns: Dict[str, Dict[str, int]] = {}

        for s in scripts:
            sid = str(s.get("scriptId") or s.get("_id") or "")
            marks = float(s.get("marksObtained") or 0)
            evaluator_id = str(s.get("evaluatorId") or "")
            qm = s.get("questionMarks") or []

            reasons = []

            # Flag 1: All questions scored 0
            if marks == 0 and qm:
                all_zero = all(float(q.get("marksObtained", 1)) == 0 for q in qm)
                if all_zero:
                    reasons.append("All questions scored zero")

            # Flag 2: IQR outlier
            if lower_fence is not None:
                if marks < lower_fence:
                    reasons.append(f"Statistical outlier (IQR): marks {marks} below lower fence {round(lower_fence, 2)}")
                elif marks > upper_fence:
                    reasons.append(f"Statistical outlier (IQR): marks {marks} above upper fence {round(upper_fence, 2)}")

            # Flag 3: Evaluator uniformity — build pattern signature
            if evaluator_id and qm:
                pattern_key = "|".join(
                    f"{q.get('questionNumber')}:{q.get('marksObtained')}" for q in qm
                )
                if evaluator_id not in evaluator_patterns:
                    evaluator_patterns[evaluator_id] = {}
                evaluator_patterns[evaluator_id][pattern_key] = (
                    evaluator_patterns[evaluator_id].get(pattern_key, 0) + 1
                )

            if reasons:
                flagged.append({"scriptId": sid, "marksObtained": marks, "reasons": reasons})

        # Flag 3 post-pass: if an evaluator gave the same mark pattern to >= 3 scripts
        for evaluator_id, patterns in evaluator_patterns.items():
            for pattern_key, count in patterns.items():
                if count >= 3:
                    # Find all scripts with this evaluator & pattern not yet flagged
                    for s in scripts:
                        sid = str(s.get("scriptId") or s.get("_id") or "")
                        qm = s.get("questionMarks") or []
                        if str(s.get("evaluatorId") or "") != evaluator_id:
                            continue
                        cur_key = "|".join(
                            f"{q.get('questionNumber')}:{q.get('marksObtained')}" for q in qm
                        )
                        if cur_key == pattern_key:
                            reason = f"Evaluator uniformity: identical question-marks pattern repeated {count} times by same evaluator"
                            # Add to existing flag entry or create new
                            existing = next((f for f in flagged if f["scriptId"] == sid), None)
                            if existing:
                                if reason not in existing["reasons"]:
                                    existing["reasons"].append(reason)
                            else:
                                flagged.append({
                                    "scriptId": sid,
                                    "marksObtained": float(s.get("marksObtained") or 0),
                                    "reasons": [reason],
                                })

        return {
            "total": n,
            "average": round(average, 2),
            "highest": highest,
            "lowest": lowest,
            "passCount": pass_count,
            "failCount": fail_count,
            "passPercentage": pass_pct,
            "passMark": pass_mark,
            "maxMarks": max_marks,
            "gradeDistribution": grade_distribution,
            "flaggedScripts": flagged,
            "flaggedCount": len(flagged),
            "iqrStatus": iqr_status,
        }
