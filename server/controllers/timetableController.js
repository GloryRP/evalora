/**
 * Timetable Controller
 * Generates professional, configurable timetable PDFs
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Exam = require('../models/Exam');
const InstitutionConfig = require('../models/InstitutionConfig');

/**
 * Generate timetable PDF with dynamic institution configuration
 */
exports.generateTimetablePDF = async (req, res) => {
  try {
    const { semester, examType = 'regular' } = req.query;

    // Fetch institution configuration
    let config = await InstitutionConfig.findOne();
    if (!config) {
      config = await InstitutionConfig.create({});
    }

    // Fetch exam data
    const exams = await Exam.find({
      semester: parseInt(semester),
      examType,
      status: 'scheduled',
    })
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

        const branchCell = config.timetable.columns.branch
          ? `<td>${exam.subjectId.department || '-'}</td>`
          : '';

        const roomCell = config.timetable.columns.room
          ? `<td>-</td>`
          : '';

        const semesterCell = config.timetable.columns.semester
          ? `<td>${exam.semester}</td>`
          : '';

        examRows += `
          <tr>
            ${dateCell}
            <td>${exam.startTime} - ${exam.endTime}</td>
            ${branchCell}
            <td><strong>${exam.subjectId.subjectCode}</strong></td>
            <td>${exam.subjectId.subjectName}</td>
            ${roomCell}
            ${semesterCell}
          </tr>
        `;
      });
    }

    // Generate column headers dynamically
    let columnBranch = config.timetable.columns.branch ? '<th>Branch</th>' : '';
    let columnRoom = config.timetable.columns.room ? '<th>Room</th>' : '';
    let columnSemester = config.timetable.columns.semester ? '<th>Semester</th>' : '';

    // Format date range
    const dateRangeStart = minDate.toLocaleDateString('en-IN');
    const dateRangeEnd = maxDate.toLocaleDateString('en-IN');
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
      '{{PAGE_FORMAT}}': config.documentDefaults.format === 'Letter' ? '8.5in 11in' : 'A4',
      '{{MARGIN_TOP}}': config.documentDefaults.marginTop,
      '{{MARGIN_BOTTOM}}': config.documentDefaults.marginBottom,
      '{{MARGIN_LEFT}}': config.documentDefaults.marginLeft,
      '{{MARGIN_RIGHT}}': config.documentDefaults.marginRight,
      '{{HEADER_BG_COLOR}}': config.branding.primaryColor,
      '{{HEADER_TEXT_COLOR}}': '#FFFFFF',
      '{{PRIMARY_COLOR}}': config.branding.primaryColor,
      '{{SECONDARY_COLOR}}': config.branding.secondaryColor,
      '{{HEADER_BG_COLOR_TABLE}}': config.timetable.tableStyle.headerBgColor,
      '{{ROW_BG_COLOR}}': config.timetable.tableStyle.rowBgColor,
      '{{ALTERNATE_ROW_BG_COLOR}}': config.timetable.tableStyle.alternateRowBgColor,
      '{{BORDER_COLOR}}': config.timetable.tableStyle.borderColor,
      '{{TABLE_FONT_SIZE}}': config.timetable.tableStyle.fontSize,
      '{{ABBREVIATION}}': config.abbreviation,
      '{{INSTITUTION_NAME}}': config.institutionName,
      '{{ADDRESS}}': addressStr,
      '{{PHONE}}': config.phone || 'Contact: +91-XXXXXXXXXX',
      '{{EMAIL}}': config.email || 'exam@institution.edu',
      '{{WEBSITE}}': config.website || 'www.institution.edu',
      '{{EXAM_TITLE}}': `${examType.toUpperCase()} EXAMINATION - SEMESTER ${semester}`,
      '{{ACADEMIC_YEAR}}': config.academicYear,
      '{{EXAM_DATE_RANGE}}': examDateRange,
      '{{GENERATED_DATE}}': generatedDate,
      '{{COLUMN_BRANCH}}': columnBranch,
      '{{COLUMN_ROOM}}': columnRoom,
      '{{COLUMN_SEMESTER}}': columnSemester,
      '{{EXAM_ROWS}}': examRows,
      '{{SIGNATURE_LABEL}}': config.timetable.signatureLabel,
      '{{SIGNATURE_DESIGNATION}}': config.timetable.signatureDesignation,
      '{{FOOTER_TEXT}}': config.timetable.footerText,
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
    const { semester, examType = 'regular' } = req.query;

    let config = await InstitutionConfig.findOne();
    if (!config) {
      config = await InstitutionConfig.create({});
    }

    const exams = await Exam.find({
      semester: parseInt(semester),
      examType,
      status: 'scheduled',
    })
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
