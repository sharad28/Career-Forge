import { resolve } from "path";

function cvMarkdownToHtml(markdown: string): string {
  return markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n(?!<[hul])/g, "\n<br>\n")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

export async function generateCVPdf(cvContent: string, candidateName: string): Promise<Uint8Array> {
  const { chromium } = await import("playwright");

  const fontDir = resolve(process.cwd(), "public/cv/fonts");
  const bodyHtml = cvMarkdownToHtml(cvContent);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${candidateName} — CV</title>
<style>
  @font-face {
    font-family: 'Space Grotesk';
    src: url('file://${fontDir}/space-grotesk-latin.woff2') format('woff2');
    font-weight: 300 700;
  }
  @font-face {
    font-family: 'DM Sans';
    src: url('file://${fontDir}/dm-sans-latin.woff2') format('woff2');
    font-weight: 100 1000;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    line-height: 1.55;
    color: #1a1a2e;
    background: #fff;
    padding: 0.6in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }
  h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4b5563;
    border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 3px;
    margin-top: 14px;
    margin-bottom: 6px;
  }
  h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #1a1a2e;
    margin-top: 8px;
    margin-bottom: 2px;
  }
  ul { margin-left: 14px; margin-bottom: 6px; }
  li { margin-bottom: 2px; }
  a { color: #4f46e5; text-decoration: none; }
  strong { font-weight: 600; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.6in", right: "0.6in", bottom: "0.6in", left: "0.6in" },
    });
    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
