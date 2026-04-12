import { BrowserController } from "./browser";
import { getFormFillingPrompt, NAVIGATION_PROMPT } from "./prompts";

export const COMPUTER_USE_REGISTRY: Record<string, { model: string, tool: string, header: string }> = {
  "claude-3-5-sonnet-20241022": {
    model: "claude-3-5-sonnet-20241022",
    tool: "computer_20241022",
    header: "computer-use-2024-10-22",
  },
  "claude-sonnet-4-6": {
    model: "claude-sonnet-4-6",
    tool: "computer_20251124",
    header: "computer-use-2025-11-24",
  },
  "claude-opus-4-6": {
    model: "claude-opus-4-6",
    tool: "computer_20251124",
    header: "computer-use-2025-11-24",
  }
};

export interface AgentResult {
  success: boolean;
  status: "submitted" | "ready_to_submit" | "captcha" | "login_required" | "error" | "needs_help";
  message: string;
  screenshot?: string; // base64 of final state
  steps: number;
}

interface ComputerUseAction {
  type: string;
  coordinate?: [number, number];
  text?: string;
}

const MAX_STEPS = 30;

export class ComputerUseAgent {
  private apiKey: string;
  private model: string;
  private browser: BrowserController;

  constructor(apiKey: string, model: string = "claude-3-5-sonnet-20241022") {
    this.apiKey = apiKey;
    this.model = model;
    this.browser = new BrowserController();
  }

  async fillApplicationForm(
    url: string,
    applicantData: {
      name: string;
      email: string;
      phone: string;
      coverLetter: string;
      linkedinUrl?: string;
      portfolioUrl?: string;
      answers: Array<{ question: string; answer: string }>;
    },
    onStep?: (step: number, action: string, screenshot: string) => void
  ): Promise<AgentResult> {
    try {
      await this.browser.launch();
      await this.browser.navigate(url);

      const systemPrompt = `${NAVIGATION_PROMPT}\n\n${getFormFillingPrompt(applicantData)}`;
      let screenshot = await this.browser.screenshot();
      let steps = 0;

      const messages: Array<{ role: string; content: unknown }> = [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshot,
              },
            },
            {
              type: "text",
              text: "Please start filling out this job application form with the provided data. Navigate to the application form if needed.",
            },
          ],
        },
      ];

      while (steps < MAX_STEPS) {
        steps++;

        // Call Claude API with computer use
        const response = await this.callClaudeComputerUse(messages);

        // Check for text-based status signals
        const textContent = this.extractText(response);
        if (textContent.includes("READY_TO_SUBMIT")) {
          const finalScreenshot = await this.browser.screenshot();
          onStep?.(steps, "Ready to submit", finalScreenshot);
          return {
            success: true,
            status: "ready_to_submit",
            message: "Form filled. Ready for your approval to submit.",
            screenshot: finalScreenshot,
            steps,
          };
        }
        if (textContent.includes("CAPTCHA_BLOCKED")) {
          return {
            success: false,
            status: "captcha",
            message: "CAPTCHA detected. Please complete manually.",
            screenshot: await this.browser.screenshot(),
            steps,
          };
        }
        if (textContent.includes("LOGIN_REQUIRED")) {
          return {
            success: false,
            status: "login_required",
            message: "Login required. Cannot proceed with automation.",
            screenshot: await this.browser.screenshot(),
            steps,
          };
        }
        if (textContent.includes("NEEDS_HELP")) {
          return {
            success: false,
            status: "needs_help",
            message: textContent,
            screenshot: await this.browser.screenshot(),
            steps,
          };
        }

        // Extract and execute tool actions
        const actions = this.extractActions(response);
        if (actions.length === 0) {
          // No actions = model is done or stuck
          break;
        }

        for (const action of actions) {
          await this.executeAction(action);
        }

        // Take new screenshot and continue
        screenshot = await this.browser.screenshot();
        onStep?.(steps, actions.map((a) => a.type).join(", "), screenshot);

        // Add the model's response and new screenshot to messages
        messages.push({
          role: "assistant",
          content: response.content,
        });

        const toolResults: any[] = [];
        const contentArray = response.content as any[];
        const toolUses = contentArray.filter(b => b.type === "tool_use");

        toolUses.forEach((block, index) => {
          // Only attach screenshot to the last tool_result to save tokens
          const isLast = index === toolUses.length - 1;
          const resultItems: any[] = [];
          
          if (isLast) {
            resultItems.push({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshot,
              },
            });
          }
          resultItems.push({ type: "text", text: "Action completed." });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: resultItems,
          });
        });

        messages.push({
          role: "user",
          content: [
            ...toolResults,
            {
              type: "text",
              text: "Continue filling the form. What is the next step?",
            },
          ],
        });
      }

      return {
        success: false,
        status: "error",
        message: `Agent stopped after ${steps} steps without completing the form.`,
        screenshot: await this.browser.screenshot(),
        steps,
      };
    } catch (error) {
      return {
        success: false,
        status: "error",
        message: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
        steps: 0,
      };
    } finally {
      await this.browser.close();
    }
  }

  /**
   * After user approves, click the submit button
   */
  async submitForm(url: string): Promise<AgentResult> {
    try {
      await this.browser.launch();
      await this.browser.navigate(url);

      // Ask Claude to find and click submit
      const screenshot = await this.browser.screenshot();
      const messages = [
        {
          role: "user" as const,
          content: [
            { type: "text", text: "Click the Submit or Apply button on this page." },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: screenshot,
              },
            },
          ],
        },
      ];

      const response = await this.callClaudeComputerUse(messages);
      const actions = this.extractActions(response);
      for (const action of actions) {
        await this.executeAction(action);
      }

      // Wait for submission result
      await new Promise((r) => setTimeout(r, 3000));
      const finalScreenshot = await this.browser.screenshot();

      return {
        success: true,
        status: "submitted",
        message: "Submit button clicked. Check the screenshot for confirmation.",
        screenshot: finalScreenshot,
        steps: 1,
      };
    } catch (error) {
      return {
        success: false,
        status: "error",
        message: `Submit error: ${error instanceof Error ? error.message : String(error)}`,
        steps: 0,
      };
    } finally {
      await this.browser.close();
    }
  }

  private async callClaudeComputerUse(
    messages: Array<{ role: string; content: unknown }>
  ): Promise<{ content: unknown[] }> {
    const config = COMPUTER_USE_REGISTRY[this.model] || COMPUTER_USE_REGISTRY["claude-3-5-sonnet-20241022"];
    
    // Prune images to prevent hitting strict token limits
    const prunedMessages = JSON.parse(JSON.stringify(messages));
    let imagesFound = 0;
    
    for (let i = prunedMessages.length - 1; i >= 0; i--) {
      const msg = prunedMessages[i];
      if (Array.isArray(msg.content)) {
        for (let j = msg.content.length - 1; j >= 0; j--) {
          const block = msg.content[j];
          if (block.type === "image") {
            imagesFound++;
            if (imagesFound > 2) {
              msg.content[j] = { type: "text", text: "[Screenshot removed to save tokens]" };
            }
          } else if (block.type === "tool_result" && Array.isArray(block.content)) {
            for (let k = block.content.length - 1; k >= 0; k--) {
              if (block.content[k].type === "image") {
                imagesFound++;
                if (imagesFound > 2) {
                  block.content[k] = { type: "text", text: "[Screenshot removed to save tokens]" };
                }
              }
            }
          }
        }
      }
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": config.header,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1024,
        tools: [
          {
            type: config.tool,
            name: "computer",
            display_width_px: 1280,
            display_height_px: 720,
          },
        ],
        messages: prunedMessages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  private extractActions(response: { content: unknown[] }): ComputerUseAction[] {
    const actions: ComputerUseAction[] = [];
    for (const block of response.content) {
      const b = block as { type?: string; name?: string; input?: ComputerUseAction };
      if (b.type === "tool_use" && b.name === "computer") {
        actions.push(b.input as ComputerUseAction);
      }
    }
    return actions;
  }

  private extractText(response: { content: unknown[] }): string {
    return response.content
      .filter((b) => (b as { type?: string }).type === "text")
      .map((b) => (b as { text?: string }).text || "")
      .join(" ");
  }

  private async executeAction(action: ComputerUseAction): Promise<void> {
    switch (action.type) {
      case "left_click":
      case "click":
        if (action.coordinate) {
          await this.browser.click(action.coordinate[0], action.coordinate[1]);
        }
        break;
      case "type":
        if (action.text) {
          await this.browser.type(action.text);
        }
        break;
      case "key":
        if (action.text) {
          await this.browser.pressKey(action.text);
        }
        break;
      case "scroll":
        await this.browser.scroll("down");
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }
}
