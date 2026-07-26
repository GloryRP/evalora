# Professional Timetable PDF Generation - Implementation Plan

## Reference
Based on the PES Institute timetable format you provided (6th Sem IA-2, May 2026), showing:
- Institution header with logo
- Table with Date, Time, Branch, Subject Code, Subject Name columns
- Multiple time slots per day (8:30am-10:00am, 2:00pm-3:30pm)
- Professional formatting with proper spacing and borders
- Official stamp/signature

## Technology Stack

### Option 1: PDFKit (Node.js native)
```bash
npm install pdfkit
```
**Pros**: Full control over layout, lightweight
**Cons**: Manual positioning required

### Option 2: Puppeteer (HTML → PDF)
```bash
npm install puppeteer
```
**Pros**: Can use HTML/CSS for styling, WYSIWYG
**Cons**: Heavier (Chromium required)

### Option 3: jsPDF (Client-side or Server-side)
```bash
npm install jspdf jspdf-autotable
```
**Pros**: Good for tables, works client-side too
**Cons**: Limited styling options

**RECOMMENDATION**: Use **Puppeteer** for best results - allows HTML/CSS templating

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd server
npm install puppeteer
```

### Step 2: Create Timetable Template
Create `server/templates/timetable-template.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 18px; margin: 5px 0; }
    .header h2 { font-size: 14px; margin: 5px 0; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .footer { margin-top: 40px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{COLLEGE_NAME}}</h1>
    <h2>{{EXAM_TITLE}}</h2>
    <h3>{{ACADEMIC_YEAR}} - Semester {{SEMESTER}}</h3>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Branch</th>
        <th>Subject Code</th>
        <th>Subject Name</th>
      </tr>
    </thead>
    <tbody>
      {{EXAM_ROWS}}
    </tbody>
  </table>
  
  <div class="footer">
    <p>{{SIGNATURE_LABEL}}</p>
    <p>{{DESIGNATION}}</p>
  </div>
</body>
</html>
```

### Step 3: Add PDF Generation Endpoint
In `server/controllers/examcellController.js`:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

exports.generateTimetablePDF = async (req, res) => {
  try {
    const { semester, examType = 'regular' } = req.query;
    
    // Fetch exam data
    const exams = await Exam.find({ 
      semester: parseInt(semester),
      examType,
      status: 'scheduled'
    })
    .populate('subjectId')
    .sort({ examDate: 1, startTime: 1 });
    
    if (exams.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No scheduled exams found' 
      });
    }
    
    // Group exams by date
    const examsByDate = {};
    exams.forEach(exam => {
      const date = new Date(exam.examDate).toLocaleDateString('en-IN');
      if (!examsByDate[date]) examsByDate[date] = [];
      examsByDate[date].push(exam);
    });
    
    // Generate HTML rows
    let examRows = '';
    for (const [date, dateExams] of Object.entries(examsByDate)) {
      dateExams.forEach((exam, idx) => {
        examRows += `
          <tr>
            ${idx === 0 ? `<td rowspan="${dateExams.length}">${date}</td>` : ''}
            <td>${exam.startTime} - ${exam.endTime}</td>
            <td>${exam.subjectId.department}</td>
            <td>${exam.subjectId.subjectCode}</td>
            <td>${exam.subjectId.subjectName}</td>
          </tr>
        `;
      });
    }
    
    // Load template
    const templatePath = path.join(__dirname, '../templates/timetable-template.html');
    let html = await fs.readFile(templatePath, 'utf-8');
    
    // Replace placeholders
    html = html
      .replace('{{COLLEGE_NAME}}', 'PES Institute of Technology & Management')
      .replace('{{EXAM_TITLE}}', `Exam Timetable - ${examType.toUpperCase()}`)
      .replace('{{ACADEMIC_YEAR}}', '2025-26')
      .replace('{{SEMESTER}}', semester)
      .replace('{{EXAM_ROWS}}', examRows)
      .replace('{{SIGNATURE_LABEL}}', 'Examination Controller')
      .replace('{{DESIGNATION}}', 'Exam Cell In-charge');
    
    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=timetable-sem${semester}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
};
```

### Step 4: Add Route
In `server/routes/examcell.js`:
```javascript
router.get('/timetable/pdf', examcellController.generateTimetablePDF);
```

### Step 5: Frontend Button
In `client/src/pages/examcell/Timetable.jsx`, add download button:
```javascript
const handleDownloadPDF = async () => {
  try {
    const response = await api.get(`/examcell/timetable/pdf?semester=${selectedSemester}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `timetable-sem${selectedSemester}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF');
  }
};
```

## Features to Include

1. **Professional Header**
   - College name and logo
   - Exam type (Regular/Midterm/Final)
   - Academic year and semester
   - Date range

2. **Formatted Table**
   - Date (with rowspan for multiple exams same day)
   - Time slot (start - end)
   - Branch/Department
   - Subject Code
   - Subject Name

3. **Footer**
   - Signature placeholder
   - Exam cell official designation
   - Generated date/time

4. **Styling**
   - Professional fonts (Arial/Times New Roman)
   - Proper borders and spacing
   - Page breaks for multiple pages
   - College branding colors

## Priority
Implement AFTER the current pipeline is working successfully (exams, allocations, assignments all saving correctly).

## Estimated Time
2-3 hours for full implementation and styling
