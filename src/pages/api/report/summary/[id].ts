import { type NextApiRequest, type NextApiResponse } from "next";
import puppeteer, { type PDFOptions } from "puppeteer";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const summary_id = req.query.id?.toString();
  const isValidId = /^[a-zA-Z0-9_-]+$/.test(summary_id ?? "");
  if (!isValidId) {
    res.status(400).send("Invalid summary ID");
    return;
  }
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

  await page.goto(`${process.env.NEXTAUTH_URL}/pdf/summary/${summary_id}`, {
    waitUntil: "networkidle2",
  });

  const pdfOption: PDFOptions = {
    printBackground: true,
    format: "A4",
  };

  const pdf = await page.pdf(pdfOption);
  const buffer = Buffer.from(pdf);

  await page.close();
  await browser.close();

  res.setHeader(
    "Content-Disposition",
    `inline; filename="${summary_id}_summary.pdf"`,
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
};

export default handler;
