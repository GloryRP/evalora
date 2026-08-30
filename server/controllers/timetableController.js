/**
 * Timetable Controller
 * Generates professional, configurable timetable PDFs
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const InstitutionConfig = require('../models/InstitutionConfig');

/**
 * Generate timetable PDF with dynamic institution configuration
 */
exports.generateTimetablePDF = async (req, res) => {
  try {
    const { semester, examType } = req.query;

    // Fetch institution configuration
    let config = await InstitutionConfig.findOne();
    if (!config) {
      config = await InstitutionConfig.create({});
    }

    // Build query
    const query = {
      status: { $in: ['scheduled', 'draft'] }
    };
    if (semester && semester !== 'all') {
      query.semester = parseInt(semester);
    }
    if (examType && examType !== 'regular' && examType !== 'all') {
      query.examType = examType;
    }

    // Fetch exam data
    const exams = await Exam.find(query)
      .populate('subjectId')
      .sort({ examDate: 1, startTime: 1 });

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled exams found for this semester',
      });
    }

    // Group exams by date
    const examsByDate = {};
    let minDate, maxDate;

    exams.forEach(exam => {
      const examDate = new Date(exam.examDate);
      const dateStr = examDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      if (!minDate || examDate < minDate) minDate = examDate;
      if (!maxDate || examDate > maxDate) maxDate = examDate;

      if (!examsByDate[dateStr]) examsByDate[dateStr] = [];
      examsByDate[dateStr].push(exam);
    });

    // Generate HTML table rows
    let examRows = '';
    for (const [dateStr, dateExams] of Object.entries(examsByDate)) {
      dateExams.forEach((exam, idx) => {
        const dateCell = idx === 0 ? `<td rowspan="${dateExams.length}"><strong>${dateStr}</strong></td>` : '';

        const dept = exam.subjectId?.department || '-';
        const code = exam.subjectId?.subjectCode || '-';
        const name = exam.subjectId?.subjectName || 'Exam';

        const branchCell = config.timetable?.columns?.branch !== false
          ? `<td>${dept}</td>`
          : '';

        const roomCell = config.timetable?.columns?.room
          ? `<td>-</td>`
          : '';

        const semesterCell = config.timetable?.columns?.semester !== false
          ? `<td>${exam.semester}</td>`
          : '';

        examRows += `
          <tr>
            ${dateCell}
            <td>${exam.startTime || '09:30 AM'} - ${exam.endTime || '12:30 PM'}</td>
            ${branchCell}
            <td><strong>${code}</strong></td>
            <td>${name}</td>
            ${roomCell}
            ${semesterCell}
          </tr>
        `;
      });
    }

    // Generate column headers dynamically
    let columnBranch = config.timetable?.columns?.branch !== false ? '<th>Branch</th>' : '';
    let columnRoom = config.timetable?.columns?.room ? '<th>Room</th>' : '';
    let columnSemester = config.timetable?.columns?.semester !== false ? '<th>Semester</th>' : '';

    // Format date range
    const dateRangeStart = minDate ? minDate.toLocaleDateString('en-IN') : '';
    const dateRangeEnd = maxDate ? maxDate.toLocaleDateString('en-IN') : '';
    const examDateRange = `${dateRangeStart} to ${dateRangeEnd}`;

    // Format generated date
    const generatedDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build address string
    const addressParts = [];
    if (config.address?.street) addressParts.push(config.address.street);
    if (config.address?.city) addressParts.push(config.address.city);
    if (config.address?.state) addressParts.push(config.address.state);
    const addressStr = addressParts.join(', ') || 'Bangalore, India';

    // Load and populate template
    const templatePath = path.join(__dirname, '../templates/timetable.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace all placeholders
    const replacements = {
      '{{PAGE_FORMAT}}': config.documentDefaults?.format === 'Letter' ? '8.5in 11in' : 'A4',
      '{{MARGIN_TOP}}': config.documentDefaults?.marginTop || '20mm',
      '{{MARGIN_BOTTOM}}': config.documentDefaults?.marginBottom || '20mm',
      '{{MARGIN_LEFT}}': config.documentDefaults?.marginLeft || '15mm',
      '{{MARGIN_RIGHT}}': config.documentDefaults?.marginRight || '15mm',
      '{{HEADER_BG_COLOR}}': config.branding?.primaryColor || '#1E3A5F',
      '{{HEADER_TEXT_COLOR}}': '#FFFFFF',
      '{{PRIMARY_COLOR}}': config.branding?.primaryColor || '#1E3A5F',
      '{{SECONDARY_COLOR}}': config.branding?.secondaryColor || '#C9A227',
      '{{HEADER_BG_COLOR_TABLE}}': config.timetable?.tableStyle?.headerBgColor || '#1E3A5F',
      '{{ROW_BG_COLOR}}': config.timetable?.tableStyle?.rowBgColor || '#FFFFFF',
      '{{ALTERNATE_ROW_BG_COLOR}}': config.timetable?.tableStyle?.alternateRowBgColor || '#F9FAFB',
      '{{BORDER_COLOR}}': config.timetable?.tableStyle?.borderColor || '#E5E7EB',
      '{{TABLE_FONT_SIZE}}': config.timetable?.tableStyle?.fontSize || '10pt',
      '{{ABBREVIATION}}': config.abbreviation || 'EVALORA',
      '{{INSTITUTION_NAME}}': config.institutionName || 'EVALORA COLLEGE OF ENGINEERING',
      '{{ADDRESS}}': addressStr,
      '{{PHONE}}': config.phone || 'Contact: +91-XXXXXXXXXX',
      '{{EMAIL}}': config.email || 'exam@institution.edu',
      '{{WEBSITE}}': config.website || 'www.institution.edu',
      '{{EXAM_TITLE}}': `${(examType ? examType.toUpperCase() : 'SEMESTER')} EXAMINATION - SEMESTER ${semester || ''}`,
      '{{ACADEMIC_YEAR}}': config.academicYear || '2025-26',
      '{{EXAM_DATE_RANGE}}': examDateRange,
      '{{GENERATED_DATE}}': generatedDate,
      '{{COLUMN_BRANCH}}': columnBranch,
      '{{COLUMN_ROOM}}': columnRoom,
      '{{COLUMN_SEMESTER}}': columnSemester,
      '{{EXAM_ROWS}}': examRows,
      '{{SIGNATURE_LABEL}}': config.timetable?.signatureLabel || 'Controller of Examinations',
      '{{SIGNATURE_DESIGNATION}}': config.timetable?.signatureDesignation || 'Exam Cell',
      '{{FOOTER_TEXT}}': config.timetable?.footerText || 'Confidential — For Internal Use Only',
    };

    for (const [key, value] of Object.entries(replacements)) {
      html = html.split(key).join(value);
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: config.documentDefaults.format,
      landscape: config.documentDefaults.orientation === 'landscape',
      printBackground: true,
      margin: {
        top: config.documentDefaults.marginTop,
        bottom: config.documentDefaults.marginBottom,
        left: config.documentDefaults.marginLeft,
        right: config.documentDefaults.marginRight,
      },
    });

    await browser.close();

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=timetable-sem${semester}-${examType}.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

/**
 * Preview timetable in HTML (for testing before PDF)
 */
exports.previewTimetable = async (req, res) => {
  try {
    const { semester, examType } = req.query;

    let config = await InstitutionConfig.findOne();
    if (!config) {
      config = await InstitutionConfig.create({});
    }

    const query = {
      status: { $in: ['scheduled', 'draft'] }
    };
    if (semester && semester !== 'all') {
      query.semester = parseInt(semester);
    }
    if (examType && examType !== 'regular' && examType !== 'all') {
      query.examType = examType;
    }

    const exams = await Exam.find(query)
      .populate('subjectId')
      .sort({ examDate: 1, startTime: 1 });

    res.json({
      success: true,
      data: {
        totalExams: exams.length,
        exams,
        config,
      },
    });
  } catch (error) {
    console.error('Error previewing timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview timetable',
      error: error.message,
    });
  }
};
