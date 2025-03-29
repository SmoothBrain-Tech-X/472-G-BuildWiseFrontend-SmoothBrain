import { type NextApiRequest, type NextApiResponse } from "next";
import puppeteer, { type PDFOptions } from "puppeteer";

const validateInput = (input: string | undefined): string | null => {
  const regex = /^[a-zA-Z0-9_-]+$/;
  return input && regex.test(input) ? input : null;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const invoice_id = validateInput(req.query.id?.toString());
  const project_id = validateInput(req.query.project_id?.toString());
  const user_id = validateInput(req.query.user_id?.toString());

  if (!invoice_id || !project_id || !user_id) {
    res.status(400).json({ error: "Invalid input" });
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

  await page.goto(
    `${process.env.NEXTAUTH_URL}/pdf/document/invoice/${invoice_id}?user_id=${user_id}&project_id=${project_id}`,
    {
      waitUntil: "networkidle2",
    },
  );

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
    `inline; filename="${project_id}_contract.pdf"`,
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
};

export default handler;
