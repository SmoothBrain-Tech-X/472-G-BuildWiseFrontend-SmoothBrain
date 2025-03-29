import { type NextApiRequest, type NextApiResponse } from "next";
import puppeteer, { type PDFOptions } from "puppeteer";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const boq_id = req.query.id?.toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const user_id = req.query.user_id?.toString().replace(/[^a-zA-Z0-9_-]/g, '');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "linux"
          ? "/usr/bin/chromium-browser"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      "--no-sandbox",
      "--headless",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1000, height: 0 });

  const url = new URL(`/pdf/boq/${boq_id}`, process.env.NEXTAUTH_URL);
  if (user_id) {
    url.searchParams.append("user_id", user_id);
  }

  await page.goto(url.toString(), {
    waitUntil: "networkidle2",
  });

  const pdfOption: PDFOptions = {
    printBackground: true,
    format: "A4",
    landscape: true,
  };

  const pdf = await page.pdf(pdfOption);
  const buffer = Buffer.from(pdf);

  await page.close();
  await browser.close();

  res.setHeader("Content-Disposition", `inline; filename="${boq_id}_boq.pdf"`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
};

export default handler;
