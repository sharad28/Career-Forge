/**
 * Placeholder for Playwright-based browser controller.
 * Used by the Claude Computer Use agent to control a browser session.
 *
 * NOTE: Requires `playwright` and `@anthropic-ai/sdk` npm packages.
 * Install with: npm install playwright @anthropic-ai/sdk
 * Then: npx playwright install chromium
 */

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "key" | "screenshot" | "navigate";
  x?: number;
  y?: number;
  text?: string;
  url?: string;
  direction?: "up" | "down";
}

export interface BrowserState {
  screenshot: string; // base64 encoded
  url: string;
  title: string;
}

export class BrowserController {
  private browser: unknown = null;
  private page: unknown = null;
  private launched = false;

  async launch(): Promise<void> {
    try {
      const { chromium } = await import("playwright");
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const context = await (this.browser as { newContext: (opts: object) => Promise<unknown> }).newContext({
        viewport: { width: 1280, height: 720 },
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
      this.page = await (context as { newPage: () => Promise<unknown> }).newPage();
      this.launched = true;
    } catch (error) {
      throw new Error(
        `Failed to launch browser. Make sure playwright is installed: npm install playwright && npx playwright install chromium. Error: ${error}`
      );
    }
  }

  async navigate(url: string): Promise<void> {
    this.ensureLaunched();
    await (this.page as { goto: (url: string, opts: object) => Promise<void> }).goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    // Wait a bit for dynamic content
    await new Promise((r) => setTimeout(r, 2000));
  }

  async screenshot(): Promise<string> {
    this.ensureLaunched();
    const buffer = await (this.page as { screenshot: (opts: object) => Promise<Buffer> }).screenshot({
      type: "png",
      fullPage: false,
    });
    return buffer.toString("base64");
  }

  async click(x: number, y: number): Promise<void> {
    this.ensureLaunched();
    const p = this.page as { mouse: { click: (x: number, y: number, opts: object) => Promise<void> } };
    await p.mouse.click(x, y, { delay: 100 });
    await new Promise((r) => setTimeout(r, 500));
  }

  async type(text: string): Promise<void> {
    this.ensureLaunched();
    const p = this.page as { keyboard: { type: (text: string, opts: object) => Promise<void> } };
    await p.keyboard.type(text, { delay: 50 });
    await new Promise((r) => setTimeout(r, 300));
  }

  async pressKey(key: string): Promise<void> {
    this.ensureLaunched();
    const p = this.page as { keyboard: { press: (key: string) => Promise<void> } };
    await p.keyboard.press(key);
    await new Promise((r) => setTimeout(r, 200));
  }

  async scroll(direction: "up" | "down", amount: number = 3): Promise<void> {
    this.ensureLaunched();
    const delta = direction === "down" ? amount * 100 : -amount * 100;
    const p = this.page as { mouse: { wheel: (x: number, y: number) => Promise<void> } };
    await p.mouse.wheel(0, delta);
    await new Promise((r) => setTimeout(r, 500));
  }

  async getState(): Promise<BrowserState> {
    this.ensureLaunched();
    const p = this.page as {
      url: () => string;
      title: () => Promise<string>;
    };
    const screenshotData = await this.screenshot();
    return {
      screenshot: screenshotData,
      url: p.url(),
      title: await p.title(),
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await (this.browser as { close: () => Promise<void> }).close();
      this.browser = null;
      this.page = null;
      this.launched = false;
    }
  }

  private ensureLaunched(): void {
    if (!this.launched || !this.page) {
      throw new Error("Browser not launched. Call launch() first.");
    }
  }
}
