/**
 * Notification Service
 * Handles all notification types: in-app + email
 * Sends role-specific notifications with proper email templates
 */

const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const InstitutionConfig = require('../models/InstitutionConfig');

console.log('=== SMTP CONFIG CHECK ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'MISSING');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'MISSING');
console.log('SMTP_USER:', process.env.SMTP_USER ? 
  process.env.SMTP_USER.substring(0,3) + '***' : 'MISSING');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 
  'SET (hidden)' : 'MISSING');
console.log('==========================');

/**
 * Main notification function - handles all notification types
 * @param {Object} params - Notification parameters
 * @param {String} params.recipientId - MongoDB User _id
 * @param {String} params.recipientRole - 'student'|'faculty'|'hod'|'principal'
 * @param {String} params.type - notification type enum
 * @param {String} params.title - notification title
 * @param {String} params.message - short plain text message
 * @param {String} params.email - recipient email address
 * @param {String} params.recipientName - for personalizing email
 * @param {Object} params.data - structured data object
 */
const sendNotification = async ({
  recipientId,
  recipientRole,
  type,
  title,
  message,
  email,
  recipientName,
  data = {},
}) => {
  console.log(`\n📧 sendNotification CALLED — type: ${type}, to: ${email}, role: ${recipientRole}`);
  try {
    console.log(`=== SENDING NOTIFICATION ===`);
    console.log(`Type: ${type}`);
    console.log(`Recipient: ${recipientName} (${recipientRole})`);
    console.log(`Email: ${email}`);

    // STEP 1: Save in-app notification to database
    const notification = await Notification.create({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      data,
      isRead: false,
      emailSent: false,
      createdAt: new Date(),
    });

    console.log(`✓ In-app notification saved (ID: ${notification._id})`);

    // STEP 2: Fetch institution name for email
    const config = await InstitutionConfig.findOne() || {};
    const institutionName = config.institutionName || 'Examination System';

    // STEP 3: Build email based on type
    let emailSubject = '';
    let emailHtml = '';

    switch (type) {
      case 'hall_ticket':
        emailSubject = `Hall Ticket - ${institutionName} - Semester ${data.semester}`;
        emailHtml = buildHallTicketEmail(data, institutionName);
        break;

      case 'invigilation_duty':
        emailSubject = `Invigilation Duty Assigned - ${institutionName}`;
        emailHtml = buildInvigilationDutyEmail(data, institutionName);
        break;

      case 'timetable_published':
        emailSubject = `Exam Timetable Published - ${data.department} - ${institutionName}`;
        emailHtml = buildTimetablePublishedEmail(data, institutionName);
        break;

      case 'result_published':
        emailSubject = `Exam Results Published - ${data.subjectCode} - ${institutionName}`;
        emailHtml = buildResultPublishedEmail(data, institutionName);
        break;

      case 'qp_assigned':
        emailSubject = `Question Paper Assignment — ${data.subjectName} — ${data.examType}`;
        emailHtml = buildQPAssignedEmail(data, institutionName);
        break;

      case 'qp_revision_requested':
        emailSubject = `Revision Requested — ${data.subjectName} Question Paper`;
        emailHtml = buildQPRevisionEmail(data, institutionName);
        break;

      case 'qp_approved':
        emailSubject = `Question Paper Approved — ${data.subjectName}`;
        emailHtml = buildQPApprovedEmail(data, institutionName);
        break;

      case 'qp_submitted':
        emailSubject = `Question Paper Submitted — ${data.subjectName} by ${data.facultyName}`;
        emailHtml = buildQPSubmittedEmail(data, institutionName);
        break;

      case 'qp_selected':
        emailSubject = `✓ Your Question Paper Selected — ${data.subjectName}`;
        emailHtml = buildQPSelectedEmail(data, institutionName);
        break;

      case 'qp_archived':
        emailSubject = `Question Paper Update — ${data.subjectName}`;
        emailHtml = buildQPArchivedEmail(data, institutionName);
        break;

      default:
        console.warn(`⚠️  Unknown notification type: ${type}`);
        return notification;
    }

    // STEP 4: Send email using Nodemailer
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.warn(`⚠️  Invalid or missing email address: ${email}`);
      await Notification.findByIdAndUpdate(notification._id, {
        emailSent: false,
        emailError: 'Invalid or missing email address',
      });
      return notification;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`✓ Email sent successfully to ${email} — messageId: ${info.messageId}`);

      // STEP 5: Update notification - email sent successfully
      await Notification.findByIdAndUpdate(notification._id, {
        emailSent: true,
        emailSentAt: new Date(),
      });
    } catch (emailError) {
      // STEP 6: Error handling - log but don't throw
      console.error(`✗ EMAIL SEND FAILED for ${email}:`, emailError.message);
      console.error('Full error:', emailError);
      
      await Notification.findByIdAndUpdate(notification._id, {
        emailSent: false,
        emailError: emailError.message,
      });
    }

    console.log(`=== NOTIFICATION COMPLETE ===\n`);
    return notification;

  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
};

/**
 * Build Hall Ticket Email HTML
 */
const buildHallTicketEmail = (data, institutionName) => {
  const examsTableRows = (data.exams || []).map((exam, i) => {
    const examDate = new Date(exam.examDate);
    const dateStr = examDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const dayStr = examDate.toLocaleDateString('en-IN', { weekday: 'long' });

    return `
      <tr style="background:${i % 2 === 0 ? 'white' : '#f8f9fa'}">
        <td style="padding:10px; border:1px solid #dee2e6;">${exam.subjectName || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${exam.subjectCode || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${dateStr}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${dayStr}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${exam.startTime || 'N/A'} - ${exam.endTime || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold;">${exam.hallName || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${exam.building || ''}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold; color:#1E3A5F; font-size:15px;">${exam.seatNumber || 'N/A'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <!-- Institution Header -->
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center;">
        <h2 style="margin:0">${institutionName}</h2>
        <p style="margin:4px 0">Examination Hall Ticket</p>
      </div>

      <!-- Student Details Box -->
      <div style="background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin: 16px 0;">
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding:6px; font-weight:bold;">Student Name:</td>
            <td style="padding:6px">${data.studentName || 'N/A'}</td>
            <td style="padding:6px; font-weight:bold;">USN:</td>
            <td style="padding:6px">${data.usn || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:bold;">Department:</td>
            <td style="padding:6px">${data.department || 'N/A'}</td>
            <td style="padding:6px; font-weight:bold;">Semester:</td>
            <td style="padding:6px">${data.semester || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <!-- Exam Schedule Table -->
      <h3 style="color:#1E3A5F; border-bottom: 2px solid #C9A227; padding-bottom: 8px;">Your Exam Schedule & Hall Allocation</h3>
      <table style="width:100%; border-collapse:collapse; font-size: 13px;">
        <thead>
          <tr style="background:#1E3A5F; color:white;">
            <th style="padding:10px; border:1px solid #dee2e6; text-align:left;">Subject</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Code</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Date</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Day</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Time</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Hall</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Building</th>
            <th style="padding:10px; border:1px solid #dee2e6; font-weight:bold; color:#C9A227;">Seat No.</th>
          </tr>
        </thead>
        <tbody>
          ${examsTableRows}
        </tbody>
      </table>

      <!-- Important Notes -->
      <div style="background:#fff3cd; border:1px solid #ffc107; padding:12px; margin:16px 0; border-radius:4px;">
        <strong>Important Instructions:</strong>
        <ul style="margin:8px 0; padding-left:20px;">
          <li>Report to your allocated hall 15 minutes before exam time</li>
          <li>Carry this hall ticket and your college ID card</li>
          <li>Mobile phones are not allowed in the examination hall</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background:#f8f9fa; padding:12px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        This is an auto-generated hall ticket from ${institutionName} Examination System.<br/>
        Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build Invigilation Duty Email HTML
 */
const buildInvigilationDutyEmail = (data, institutionName) => {
  const dutiesTableRows = (data.duties || []).map((duty, i) => {
    const examDate = new Date(duty.examDate);
    const dateStr = examDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const dayStr = examDate.toLocaleDateString('en-IN', { weekday: 'long' });

    const roleDisplay = duty.role === 'chief' ? 'Chief Invigilator' : 'Invigilator';

    return `
      <tr style="background:${i % 2 === 0 ? 'white' : '#f8f9fa'}">
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${dateStr}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${dayStr}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${duty.startTime || 'N/A'} - ${duty.endTime || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6;">${duty.subjectName || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${duty.subjectCode || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${duty.semester || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${duty.department || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold;">${duty.hallName || 'N/A'}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center;">${duty.building || ''}</td>
        <td style="padding:10px; border:1px solid #dee2e6; text-align:center; font-weight:bold; color:${duty.role === 'chief' ? '#C9A227' : '#1E3A5F'};">${roleDisplay}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <!-- Institution Header -->
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center;">
        <h2 style="margin:0">${institutionName}</h2>
        <p style="margin:4px 0">Invigilation Duty Assignment</p>
      </div>

      <!-- Faculty Details Box -->
      <div style="background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin: 16px 0;">
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding:6px; font-weight:bold;">Faculty Name:</td>
            <td style="padding:6px">${data.facultyName || 'N/A'}</td>
            <td style="padding:6px; font-weight:bold;">Employee ID:</td>
            <td style="padding:6px">${data.employeeId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:bold;">Department:</td>
            <td style="padding:6px" colspan="3">${data.department || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <!-- Duties Table -->
      <h3 style="color:#1E3A5F; border-bottom: 2px solid #C9A227; padding-bottom: 8px;">Your Invigilation Duties</h3>
      <table style="width:100%; border-collapse:collapse; font-size: 13px;">
        <thead>
          <tr style="background:#1E3A5F; color:white;">
            <th style="padding:10px; border:1px solid #dee2e6;">Date</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Day</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Time</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Subject</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Code</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Sem</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Dept</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Hall</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Building</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Role</th>
          </tr>
        </thead>
        <tbody>
          ${dutiesTableRows}
        </tbody>
      </table>

      <!-- Important Notes -->
      <div style="background:#fff3cd; border:1px solid #ffc107; padding:12px; margin:16px 0; border-radius:4px;">
        <strong>Important Instructions:</strong>
        <ul style="margin:8px 0; padding-left:20px;">
          <li>Please report 30 minutes before exam time</li>
          <li>Carry your college ID card</li>
          <li>Contact Exam Cell for any clarifications</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background:#f8f9fa; padding:12px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        This is an auto-generated notification from ${institutionName} Examination System.<br/>
        Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build Timetable Published Email HTML
 */
const buildTimetablePublishedEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Institution Header -->
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center;">
        <h2 style="margin:0">${institutionName}</h2>
        <p style="margin:4px 0">Exam Timetable Published</p>
      </div>

      <!-- Content -->
      <div style="padding: 20px; background: white;">
        <p style="font-size: 16px; color: #333;">
          <strong>Dear HOD, ${data.department || 'Department'},</strong>
        </p>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          The examination timetable has been published for your department.
        </p>

        <!-- Summary Box -->
        <div style="background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin: 16px 0; border-radius: 4px;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="padding:8px; font-weight:bold;">Department:</td>
              <td style="padding:8px">${data.department || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold;">Total Exams:</td>
              <td style="padding:8px">${data.examsCount || 0}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold;">Date Range:</td>
              <td style="padding:8px">${data.dateRange?.start || 'N/A'} to ${data.dateRange?.end || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold;">Academic Year:</td>
              <td style="padding:8px">${data.academicYear || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Please login to the system to view the complete timetable and hall allocations.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Timetable
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f8f9fa; padding:12px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        This is an auto-generated notification from ${institutionName} Examination System.<br/>
        Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build Result Published Email HTML
 */
const buildResultPublishedEmail = (data, institutionName) => {
  const isPass = data.grade === 'PASS';
  const gradeColor = isPass ? '#2D7A5F' : '#ef4444';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <!-- Institution Header -->
      <div style="background: #1E3A5F; color: white; padding: 24px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size: 20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size: 14px; opacity: 0.9;">Official Examination Result Sheet</p>
      </div>

      <!-- Content -->
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">
          <strong>Dear ${data.studentName || 'Student'},</strong>
        </p>

        <p style="font-size: 14px; color: #555; line-height: 1.6;">
          Your final results for the following subject have been evaluated and published by the Exam Cell.
        </p>

        <!-- Result Details Card -->
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666; width: 120px;">USN:</td>
              <td style="padding: 6px 0; color: #111;">${data.usn || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Subject Name:</td>
              <td style="padding: 6px 0; color: #111; font-weight: 500;">${data.subjectName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Subject Code:</td>
              <td style="padding: 6px 0; color: #111; font-family: monospace; font-size: 13px;">${data.subjectCode || 'N/A'}</td>
            </tr>
            <tr style="border-top: 1px solid #e9ecef;">
              <td style="padding: 12px 0 6px 0; font-weight: bold; color: #666;">Marks Obtained:</td>
              <td style="padding: 12px 0 6px 0; color: #111; font-size: 16px; font-weight: bold;">
                ${data.marksObtained} <span style="font-size: 13px; font-weight: normal; color: #888;">/ ${data.maxMarks}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #666;">Result Status:</td>
              <td style="padding: 6px 0; color: ${gradeColor}; font-weight: bold; font-size: 14px; text-transform: uppercase;">
                ${data.grade || 'N/A'}
              </td>
            </tr>
            ${data.comments ? `
            <tr style="border-top: 1px solid #e9ecef;">
              <td style="padding: 12px 0 0 0; font-weight: bold; color: #666; vertical-align: top;">Remarks:</td>
              <td style="padding: 12px 0 0 0; color: #555; font-style: italic;">"${data.comments}"</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="font-size: 13px; color: #777; line-height: 1.6;">
          Please log into your Vidyā Student Portal to view your complete semester marks card, check your SGPA, and download official documents.
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; transition: background 0.2s;">
            View Full Results
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f8f9fa; padding:16px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        This is an auto-generated notification from ${institutionName} Examination System.<br/>
        For any discrepancies, please contact the Exam Cell.
      </div>
    </div>
  `;
};

/**
 * Build QP Assignment Email HTML (to faculty)
 */
const buildQPAssignedEmail = (data, institutionName) => {
  const slotsHtml = (data.slots || []).map((slot, i) => {
    const main = `Q${slot.questionNumber || i + 1}: ${slot.maxMarks}M${slot.or ? '' : ' (Compulsory)'}`;
    const or = slot.or ? `<br/>&nbsp;&nbsp;&nbsp;&nbsp;OR Q${slot.or.questionNumber}: ${slot.or.maxMarks}M` : '';
    return `<li style="margin-bottom:4px;">${main}${or}</li>`;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper Assignment</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear ${data.facultyName || 'Faculty'},</strong></p>
        <p style="font-size:14px; color:#555; line-height:1.6;">You have been assigned to submit the question paper for:</p>
        <div style="background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; margin:16px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="padding:5px 0; font-weight:bold; color:#666; width:130px;">Subject:</td><td style="padding:5px 0;">${data.subjectName || 'N/A'} (${data.subjectCode || 'N/A'})</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Exam Type:</td><td style="padding:5px 0;">${data.examType || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Semester:</td><td style="padding:5px 0;">Sem ${data.semester || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Max Marks:</td><td style="padding:5px 0;">${data.maxMarks || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Deadline:</td><td style="padding:5px 0; color:#dc2626; font-weight:bold;">${data.deadline || 'N/A'}</td></tr>
          </table>
        </div>
        ${slotsHtml ? `
        <p style="font-size:14px; color:#555; margin-bottom:6px;"><strong>The question paper must follow this structure:</strong></p>
        <ul style="font-size:13px; color:#444; line-height:1.8; margin:0 0 16px 0; padding-left:20px;">${slotsHtml}</ul>
        ` : ''}
        <p style="font-size:14px; color:#555; line-height:1.6;">Please log in to <strong>Evalora</strong> and submit your question paper before the deadline.</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/faculty/question-papers"
             style="display:inline-block; background:#1E3A5F; color:white; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
            Open Evalora Portal
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System. Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build QP Revision Requested Email HTML (to faculty)
 */
const buildQPRevisionEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper — Revision Requested</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear ${data.facultyName || 'Faculty'},</strong></p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          The Exam Cell has reviewed your question paper for <strong>${data.subjectName || 'Unknown Subject'}</strong> and has requested revisions.
        </p>
        <div style="background:#fff7ed; border:1px solid #f97316; border-radius:6px; padding:16px; margin:16px 0;">
          <p style="font-size:13px; color:#9a3412; font-weight:bold; margin:0 0 8px 0;">Reviewer's Comments:</p>
          <p style="font-size:14px; color:#7c2d12; font-weight:600; margin:0; line-height:1.6;">${data.reviewNote || 'No comments provided.'}</p>
        </div>
        <p style="font-size:14px; color:#555; line-height:1.6;">Please log in to Evalora, update your question paper, and resubmit.</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/faculty/question-papers"
             style="display:inline-block; background:#1E3A5F; color:white; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
            Open Evalora Portal
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System. Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build QP Approved Email HTML (to faculty)
 */
const buildQPApprovedEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper Approved ✓</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear ${data.facultyName || 'Faculty'},</strong></p>
        <div style="background:#f0fdf4; border:1px solid #22c55e; border-radius:6px; padding:16px; margin:16px 0; text-align:center;">
          <p style="font-size:18px; color:#15803d; font-weight:700; margin:0;">✓ Question Paper Approved</p>
          <p style="font-size:14px; color:#16a34a; margin:8px 0 0 0;">${data.subjectName || 'Unknown Subject'}</p>
        </div>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          Your question paper for <strong>${data.subjectName || 'Unknown Subject'}</strong> has been reviewed and approved by the Exam Cell.
        </p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          The question paper is now <strong>locked</strong> and will be used for the examination. No further edits are allowed.
        </p>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System. Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

/**
 * Build QP Submitted Email HTML (to Exam Cell)
 */
const buildQPSubmittedEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper Submitted — Review Required</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear Exam Cell,</strong></p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          <strong>${data.facultyName || 'A faculty member'}</strong> has submitted the question paper for:
        </p>
        <div style="background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; padding:16px; margin:16px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="padding:5px 0; font-weight:bold; color:#666; width:130px;">Subject:</td><td style="padding:5px 0;">${data.subjectName || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Exam Type:</td><td style="padding:5px 0;">${data.examType || 'N/A'}</td></tr>
            <tr><td style="padding:5px 0; font-weight:bold; color:#666;">Semester:</td><td style="padding:5px 0;">Sem ${data.semester || 'N/A'}</td></tr>
          </table>
        </div>
        <p style="font-size:14px; color:#555; line-height:1.6;">Please log in to review and approve / request revision.</p>
        <div style="text-align:center; margin:24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/examcell/question-papers"
             style="display:inline-block; background:#1E3A5F; color:white; padding:12px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
            Review Submission
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System.
      </div>
    </div>
  `;
};

/**
 * Build QP Selected Email HTML (to winning faculty)
 */
const buildQPSelectedEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper — Official Selection</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear ${data.facultyName || 'Faculty'},</strong></p>
        <div style="background:#f0fdf4; border:2px solid #22c55e; border-radius:8px; padding:20px; margin:16px 0; text-align:center;">
          <p style="font-size:22px; color:#15803d; font-weight:700; margin:0;">★ Congratulations!</p>
          <p style="font-size:15px; color:#16a34a; margin:8px 0 0 0;">Your Question Paper Has Been Selected</p>
        </div>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          Your question paper for <strong>${data.subjectName || 'the subject'}</strong> has been reviewed and selected as the <strong>official question paper</strong> for ${data.examType || 'the examination'}, Semester ${data.semester || 'N/A'}.
        </p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          The paper is now <strong>locked</strong> and will be used for the official examination. No further edits are permitted.
        </p>
        <p style="font-size:13px; color:#6c757d; margin-top:20px;">Thank you for your dedication and contribution to the examination process.</p>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System.
      </div>
    </div>
  `;
};

/**
 * Build QP Archived Email HTML (to faculty whose paper was not selected)
 */
const buildQPArchivedEmail = (data, institutionName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
      <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #C9A227;">
        <h2 style="margin:0; font-size:20px;">${institutionName}</h2>
        <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">Question Paper — Review Update</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size:16px; color:#333; margin-top:0;"><strong>Dear ${data.facultyName || 'Faculty'},</strong></p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          Thank you for submitting your question paper for <strong>${data.subjectName || 'the subject'}</strong>.
        </p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          After carefully reviewing all submissions, the Exam Cell has selected a different paper for this examination. We sincerely appreciate your effort and contribution.
        </p>
        <p style="font-size:14px; color:#555; line-height:1.6;">
          Your submission has been <strong>archived</strong> for reference. Your hard work and dedication to the examination process are valued.
        </p>
        <p style="font-size:13px; color:#6c757d; margin-top:20px;">Thank you for your continued contribution to academic excellence.</p>
      </div>
      <div style="background:#f8f9fa; padding:14px; text-align:center; font-size:12px; color:#6c757d; border-top:1px solid #dee2e6;">
        Auto-generated by ${institutionName} Examination System. Contact Exam Cell for any queries.
      </div>
    </div>
  `;
};

module.exports = {
  sendNotification,
};
