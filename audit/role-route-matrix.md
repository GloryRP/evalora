# Role-Route Authorization Matrix

Generated: 2026-10-10T06:38:53.075Z

| Protected Endpoint | Required Role | Admin | Exam Cell | Faculty | Student | HOD | Principal |
|--------------------|---------------|-------|-----------|---------|---------|-----|-----------|
| **Admin Stats** | `admin` | ✅ 200 OK | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden |
| **Admin Students List** | `admin` | ✅ 200 OK | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden |
| **ExamCell Exams** | `examcell, admin` | ✅ 200 OK | ✅ 200 OK | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden |
| **Faculty Duties** | `faculty` | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | ✅ 200 OK | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden |
| **Student Results** | `student` | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | ✅ 200 OK | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden |
| **HOD Insights** | `hod` | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | ✅ 200 OK | 🛡️ 403 Forbidden |
| **Principal Insights** | `principal` | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | 🛡️ 403 Forbidden | ✅ 200 OK |
