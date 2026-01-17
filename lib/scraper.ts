import { chromium } from 'playwright';
import { addGoldPrice, getScraperUrl } from '@/lib/db';

export async function scrapeAndSave() {
  let browser: any;
  try {
    const url =
      (await getScraperUrl().catch(() => null)) ||
      'https://lsjr.ccb.com/msmp/ecpweb/page/internet/dist/preciousMetalsDetail.html?CCB_EmpID=71693716&PM_PD_ID=261108522&Org_Inst_Rgon_Cd=JS&page=preciousMetalsDetail';

    console.log('Scraper using url:', url);

    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    await page.goto(url);
    await page.waitForFunction(() => {
      return document.body.innerText.includes('元/克');
    }, { timeout: 30000 });

    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const match = bodyText.match(/(\d+(?:\.\d+)?)\s*元\/克/);
      if (match) {
        return {
          price: match[1],
          unit: '元/克',
          fullText: match[0]
        };
      }
      return null;
    });

    if (!data) {
      throw new Error('Price pattern not found on page');
    }

    const timestamp = new Date().toISOString();
    await addGoldPrice(parseFloat(data.price), data.unit, timestamp);
    console.log('Scraper success', data.price, timestamp);
    return { data, timestamp };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
