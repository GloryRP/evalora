/**
 * Automated UI Screenshot Capture Script using Puppeteer
 * Takes screenshots of:
 * 1. Login Page
 * 2. Admin Dashboard
 * 3. Exam Cell Dashboard
 * 4. Faculty Dashboard
 * 5. Student Dashboard
 * 6. HOD Dashboard
 * 7. Principal Dashboard
 * 8. Shared Profile Page (with functional Back Button)
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CLIENT_URL = 'http://localhost:5173';

async function capture() {
  console.log('=== STARTING AUTOMATED SCREENSHOT CAPTURE ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function takeScreenshot(name) {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`✓ Saved screenshot: ${name}.png`);
  }

  try {
    // 1. Login Page
    console.log('Navigating to Login page...');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot('01_login_page');

    // Helper: Login
    async function loginAs(username, password) {
      await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('input', { timeout: 5000 });
      
      // Clear inputs
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = '';
        if (inputs[1]) inputs[1].value = '';
      });

      // Type username and password
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].type(username);
        await inputs[1].type(password);
      }

      // Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
    }

    // 2. Admin Dashboard
    console.log('Logging in as Admin...');
    await loginAs('ADMIN1', 'Admin@123');
    await takeScreenshot('02_admin_dashboard');

    // 3. Exam Cell Dashboard
    console.log('Logging in as Exam Cell...');
    await loginAs('EXAMCELL1', 'ExamCell@123');
    await takeScreenshot('03_examcell_dashboard');

    // 4. Faculty Dashboard
    console.log('Logging in as Faculty...');
    await loginAs('FACULTY1', 'Faculty@123');
    await takeScreenshot('04_faculty_dashboard');

    // 5. Student Dashboard
    console.log('Logging in as Student...');
    await loginAs('STUDENT1', 'Student@123');
    await takeScreenshot('05_student_dashboard');

    // 6. HOD Dashboard
    console.log('Logging in as HOD...');
    await loginAs('HOD_CSE', 'Hod@123');
    await takeScreenshot('06_hod_dashboard');

    // 7. Principal Dashboard
    console.log('Logging in as Principal...');
    await loginAs('PRINCIPAL1', 'Principal@123');
    await takeScreenshot('07_principal_dashboard');

    // 8. Profile Page with Back Button
    console.log('Navigating to Profile page...');
    await page.goto(`${CLIENT_URL}/profile`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    await takeScreenshot('08_profile_with_back_button');

  } catch (err) {
    console.error('Error during screenshot capture:', err.message);
  } finally {
    await browser.close();
    console.log('\nFinished UI screenshot capture.');
  }
}

capture();
