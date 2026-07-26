/**
 * Email Connection Test Script
 * Tests SMTP connection and sends a test email
 * Run with: node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmailConnection = async () => {
  console.log('\n=== TESTING EMAIL CONNECTION ===\n');

  // Step 1: Check environment variables
  console.log('Step 1: Checking environment variables...');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✓ SET (hidden)' : '❌ NOT SET'}`);
  console.log(`SMTP_FROM: ${process.env.SMTP_FROM || '❌ NOT SET'}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('\n❌ SMTP credentials not configured in .env file');
    process.exit(1);
  }

  console.log('✓ Environment variables configured\n');

  // Step 2: Create transporter
  console.log('Step 2: Creating SMTP transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('✓ Transporter created\n');

  // Step 3: Verify connection
  console.log('Step 3: Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nCommon issues:');
    console.error('1. Gmail App Password not enabled (use App Password, not regular password)');
    console.error('2. Incorrect credentials in .env file');
    console.error('3. Gmail account security settings blocking access');
    console.error('4. Network firewall blocking SMTP port 587');
    process.exit(1);
  }

  // Step 4: Send test email
  console.log('Step 4: Sending test email...');
  const testRecipient = process.env.SMTP_USER; // Send to yourself

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testRecipient,
      subject: '✅ Test Email from Exam Automation System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🎉 Email Configuration Successful!</h2>
          </div>
          
          <div style="background: white; padding: 24px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Congratulations! Your SMTP email configuration is working correctly.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0;">
              <strong style="color: #0c4a6e;">Configuration Details:</strong>
              <ul style="margin: 10px 0; padding-left: 20px; color: #334155;">
                <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                <li>SMTP User: ${process.env.SMTP_USER}</li>
                <li>From Address: ${process.env.SMTP_FROM}</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Your notification system is now ready to send:
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>📧 Hall tickets to students</li>
              <li>📧 Invigilation duty assignments to faculty</li>
              <li>📧 Timetable notifications</li>
            </ul>

            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 12px; border-radius: 4px; margin-top: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                ✅ <strong>Next Step:</strong> Run the exam pipeline to trigger automatic notifications
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Test email sent on ${new Date().toLocaleString()}
            </p>
            <p style="font-size: 12px; color: #999; margin: 4px 0 0 0;">
              Exam Automation System - Notification Service
            </p>
          </div>
        </div>
      `,
    });

    console.log('✓ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`\n📧 Check your inbox: ${testRecipient}`);
    console.log('\n=== EMAIL TEST COMPLETE ===\n');
    console.log('✅ Your notification system is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Run the seed script: node seed.js');
    console.log('2. Start the servers (MongoDB, AI Service, Backend, Frontend)');
    console.log('3. Login as EXAMCELL1 and run the full pipeline');
    console.log('4. Check student/faculty accounts for notifications\n');

  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    process.exit(1);
  }

  process.exit(0);
};

// Run the test
testEmailConnection();
