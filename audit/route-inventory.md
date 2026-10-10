# API Route Inventory - Evalora Backend

Generated: 2026-10-10T06:35:55.385Z
Total Routes Discovered: 139

## Summary Statistics
- **Total Routes**: 139
- **Public Routes (No Authentication)**: 6
- **Authenticated (Any Valid Token)**: 47
- **Strict Role Restricted**: 86

## Public Routes (Unauthenticated)

| Method | Path | File | Security Note |
|--------|------|------|---------------|
| `POST` | `/api/v1/auth/login` | `auth.js` | Authentication endpoint (Intended Public) |
| `POST` | `/api/v1/auth/logout` | `auth.js` | Logout endpoint (Client-side token purge) |
| `GET` | `/api/v1/institution/config` | `institution.js` | ⚠️ Institution config is publicly accessible without token |
| `GET` | `/api/v1/institution/timetable-config` | `institution.js` | ⚠️ Institution config is publicly accessible without token |
| `GET` | `/api/v1/institution/current` | `institution.js` | ⚠️ Institution config is publicly accessible without token |
| `GET` | `/api/v1/institution/academic-years` | `institution.js` | ⚠️ Institution config is publicly accessible without token |

---

## Complete Route Inventory

| Method | Full Path | Source File | Auth Required | Allowed Roles | Status / Flag |
|--------|-----------|-------------|---------------|---------------|---------------|
| **GET** | `/api/v1/admin/stats` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/students/bulk` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/students` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/students` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/students/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/students/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/faculty/bulk` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/faculty` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/faculty` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/faculty/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/faculty/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/subjects/bulk` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/subjects` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/subjects` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/subjects/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/subjects/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/departments/bulk` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/departments` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/departments` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/departments/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/departments/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/grading-scheme` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/grading-schemes/all` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/grading-schemes` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/grading-scheme` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/grading-schemes/:id/activate` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/grading-schemes/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/grading-schemes/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PATCH** | `/api/v1/admin/users/:userId/reset-password` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/users` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/admin/halls` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/admin/halls` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/admin/halls/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **DELETE** | `/api/v1/admin/halls/:id` | `admin.js` | Yes | `admin` | ✅ Restricted |
| **POST** | `/api/v1/auth/login` | `auth.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **POST** | `/api/v1/auth/logout` | `auth.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **GET** | `/api/v1/auth/me` | `auth.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PATCH** | `/api/v1/auth/change-password` | `auth.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PATCH** | `/api/v1/auth/update-profile` | `auth.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/subjects` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/exams` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/exams` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PUT** | `/api/v1/examcell/exams/:examId` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **DELETE** | `/api/v1/examcell/exams/:examId` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **DELETE** | `/api/v1/examcell/exams/series/delete` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/halls` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/halls` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PUT** | `/api/v1/examcell/halls/:hallId` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **DELETE** | `/api/v1/examcell/halls/:hallId` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/agents/run-pipeline` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/agents/run-single` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/hall-allocations/generate` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/invigilator-assignments/generate` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/agents/runs` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/timetable` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/timetable/generate` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/timetable/confirm` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/hall-allocations` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/invigilator-assignments` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/students` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/faculty` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/departments` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/upload` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/bulk-upload` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/bulk-upload-ai` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/assign-evaluator` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PATCH** | `/api/v1/examcell/answer-scripts/manual-assign-evaluator` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/bundle-distribute` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/answer-scripts/review` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/answer-scripts/publish` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/qp-templates` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/qp-templates/:examType` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/qp-templates` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/question-papers` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/question-papers` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/examcell/question-papers/exam/:examId` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PUT** | `/api/v1/examcell/question-papers/:paperId/approve` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **POST** | `/api/v1/examcell/agents/run-evaluation` | `examcell.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/faculty/duties` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/faculty/evaluations` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **PUT** | `/api/v1/faculty/evaluations/:scriptId` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/faculty/question-papers` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **PUT** | `/api/v1/faculty/question-papers/:paperId/submit` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **PUT** | `/api/v1/faculty/question-papers/:paperId/upload` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **PUT** | `/api/v1/faculty/evaluations/publish-class/:examId` | `faculty.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/file-proxy` | `fileProxy.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/hod/profile` | `hod.js` | Yes | `hod` | ✅ Restricted |
| **GET** | `/api/v1/hod/insights` | `hod.js` | Yes | `hod` | ✅ Restricted |
| **GET** | `/api/v1/institution/config` | `institution.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **PUT** | `/api/v1/institution/config` | `institution.js` | Yes | `admin,examcell` | ✅ Restricted |
| **GET** | `/api/v1/institution/timetable-config` | `institution.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **GET** | `/api/v1/institution/current` | `institution.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **GET** | `/api/v1/institution/academic-years` | `institution.js` | **NO** | `None (Public)` | ⚠️ PUBLIC / NO AUTH |
| **POST** | `/api/v1/institution/academic-years` | `institution.js` | Yes | `admin` | ✅ Restricted |
| **PUT** | `/api/v1/institution/academic-years/current` | `institution.js` | Yes | `admin` | ✅ Restricted |
| **GET** | `/api/v1/notifications` | `notifications.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/notifications/unread-count` | `notifications.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PATCH** | `/api/v1/notifications/:id/read` | `notifications.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **PATCH** | `/api/v1/notifications/read-all` | `notifications.js` | Yes | `Any logged-in role` | ℹ️ Any authenticated user |
| **GET** | `/api/v1/principal/insights` | `principal.js` | Yes | `principal` | ✅ Restricted |
| **POST** | `/api/v1/qp-submissions/auto-assign` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/subjects-preview` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/overview` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/subject/:subjectId` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **PATCH** | `/api/v1/qp-submissions/:id/review` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/qp-submissions/select` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/qp-submissions/send-reminder` | `qpSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/my-assignments` | `qpSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/my-assignments/:id` | `qpSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/qp-submissions/:id/save-draft` | `qpSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/qp-submissions/:id/submit` | `qpSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/qp-submissions/:id/revise` | `qpSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/qp-submissions/:id` | `qpSubmission.js` | Yes | `examcell,faculty` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/my-assignments` | `questionPaperSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/my-assignments/:id` | `questionPaperSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/question-paper-submission/:id/save-draft` | `questionPaperSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/question-paper-submission/:id/submit` | `questionPaperSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **PATCH** | `/api/v1/question-paper-submission/:id/revise` | `questionPaperSubmission.js` | Yes | `faculty` | ✅ Restricted |
| **POST** | `/api/v1/question-paper-submission/auto-assign` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/question-paper-submission/select` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/question-paper-submission/send-reminder` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/subjects-preview` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/overview` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/subject/:subjectId` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/question-paper-submission/:id` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **PATCH** | `/api/v1/question-paper-submission/:id/review` | `questionPaperSubmission.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/results/my-results` | `results.js` | Yes | `student` | ✅ Restricted |
| **GET** | `/api/v1/results/my-results/:semester` | `results.js` | Yes | `student` | ✅ Restricted |
| **POST** | `/api/v1/results/compute` | `results.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/results` | `results.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/results/publish` | `results.js` | Yes | `examcell` | ✅ Restricted |
| **POST** | `/api/v1/results/publish/:resultId` | `results.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/results/:studentId` | `results.js` | Yes | `examcell` | ✅ Restricted |
| **GET** | `/api/v1/student/hall-ticket` | `student.js` | Yes | `student` | ✅ Restricted |
| **GET** | `/api/v1/student/timetable` | `student.js` | Yes | `student` | ✅ Restricted |
| **GET** | `/api/v1/student/results` | `student.js` | Yes | `student` | ✅ Restricted |
| **GET** | `/api/v1/timetable/pdf` | `timetable.js` | Yes | `admin,examcell` | ✅ Restricted |
| **GET** | `/api/v1/timetable/preview` | `timetable.js` | Yes | `admin,examcell` | ✅ Restricted |
