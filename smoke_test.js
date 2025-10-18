const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:8000/AkaiMPCChordProgressionGenerator/AkaiMPCChordProgressionGenerator.html';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: 'console', text });
    console.log('[PAGE]', text);
  });
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: err.message });
    console.error('[ERROR]', err.message);
  });
  page.on('requestfailed', req => {
    logs.push({ type: 'requestfailed', url: req.url(), reason: req.failure().errorText });
    console.error('[REQ-FAIL]', req.url(), req.failure().errorText);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('Page loaded');

    // Wait for generate button
    await page.waitForSelector('#generateBtn', { timeout: 5000 });
    console.log('Found generate button, clicking...');
    await page.click('#generateBtn');

    // Wait for progression card to appear
    await page.waitForSelector('.progression-card', { timeout: 10000 });
    console.log('Progression card rendered');

    // Click first chord pad if present
    const pad = await page.$('.chord-pad');
    if (pad) {
      console.log('Clicking first chord pad');
      await pad.click();
      // Give a short time for audio JS to run and any logs to appear
      await page.waitForTimeout(1000);
    } else {
      console.log('No chord pad found to click');
    }

    // Try export button presence
    const downloadAllBtn = await page.$('#downloadAllBtn');
    if (downloadAllBtn) {
      console.log('Download all button exists (visible or hidden)');
    } else {
      console.log('Download all button not found');
    }

    // Wait a moment for any late console errors
    await page.waitForTimeout(1000);

    // Summarize console messages
    console.log('\n--- PAGE CONSOLE LOGS ---');
    logs.forEach(l => console.log(l.type, l.text));

    // Determine success heuristics
    const hadError = logs.some(l => l.type === 'pageerror');
    if (hadError) {
      console.error('Smoke test detected page errors');
      process.exitCode = 2;
    } else {
      console.log('Smoke test finished without page errors (heuristic)');
    }
  } catch (err) {
    console.error('Smoke test failed:', err.message);
    process.exitCode = 3;
  } finally {
    await browser.close();
  }
})();
