const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER UNCAUGHT ERROR:', err.message));

  console.log('Opening login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="username"]', 'EXAMCELL1');
  await page.type('input[name="password"]', 'ExamCell@123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));
  console.log('After submit URL:', page.url());

  console.log('Navigating to /examcell/publish-results...');
  await page.goto('http://localhost:5173/examcell/publish-results', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL:', page.url());

  const html = await page.content();
  console.log('HTML length:', html.length);
  if (html.includes('Publish Results')) console.log('Found "Publish Results" in page HTML!');
  else console.log('Page HTML snippet:', html.substring(0, 400));

  await browser.close();
})();
