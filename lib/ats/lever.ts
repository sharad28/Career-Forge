import type { ATSAdapter, ATSJob, ATSQuestion } from "./types";

export class LeverAdapter implements ATSAdapter {
  async fetchJob(boardToken: string, jobId: string): Promise<ATSJob> {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${boardToken}/${jobId}`
    );
    if (!res.ok) {
      throw new Error(`Lever API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();

    // Lever has standard fields + custom lists
    const questions: ATSQuestion[] = [];

    // Standard required fields
    questions.push(
      { id: "name", label: "Full Name", type: "text", required: true },
      { id: "email", label: "Email", type: "text", required: true },
      { id: "phone", label: "Phone", type: "text", required: false },
      { id: "resume", label: "Resume", type: "file", required: true }
    );

    // Custom questions from the posting
    if (data.lists) {
      for (const list of data.lists) {
        questions.push({
          id: `cards[${list.text}]`,
          label: list.text || "",
          type: "textarea",
          required: false,
        });
      }
    }

    return {
      title: data.text || "",
      company: data.categories?.team || boardToken,
      description: data.descriptionPlain || stripHtml(data.description || ""),
      location: data.categories?.location || "",
      url: data.hostedUrl || `https://jobs.lever.co/${boardToken}/${jobId}`,
      questions,
    };
  }

}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
