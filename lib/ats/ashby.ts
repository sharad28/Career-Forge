import type { ATSAdapter, ATSJob, ATSQuestion } from "./types";

export class AshbyAdapter implements ATSAdapter {
  async fetchJob(boardToken: string, jobId: string): Promise<ATSJob> {
    const res = await fetch(
      "https://api.ashbyhq.com/posting-api/job-posting/info",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobPostingId: jobId }),
      }
    );

    if (!res.ok) {
      throw new Error(`Ashby API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const info = data.info || data;

    // Build questions from form definition
    const questions: ATSQuestion[] = [];

    // Standard fields
    questions.push(
      { id: "name", label: "Full Name", type: "text", required: true },
      { id: "email", label: "Email", type: "text", required: true },
      { id: "phone", label: "Phone", type: "text", required: false },
      { id: "resume", label: "Resume", type: "file", required: true },
      { id: "linkedInUrl", label: "LinkedIn URL", type: "text", required: false }
    );

    // Custom survey questions
    if (info.applicationFormDefinition?.sections) {
      for (const section of info.applicationFormDefinition.sections) {
        for (const field of section.fieldEntries || []) {
          const f = field.field || field;
          questions.push({
            id: f.path || f.id || "",
            label: f.title || f.label || "",
            type: mapAshbyType(f.type),
            required: field.isRequired || false,
            options: f.selectableValues?.map(
              (v: { label?: string; value?: string }) => v.label || v.value || ""
            ),
          });
        }
      }
    }

    return {
      title: info.title || "",
      company: info.organizationName || boardToken,
      description: info.descriptionPlain || stripHtml(info.descriptionHtml || ""),
      location: info.locationName || info.location || "",
      url:
        info.externalLink ||
        `https://jobs.ashbyhq.com/${boardToken}/${jobId}`,
      questions,
    };
  }

}

function mapAshbyType(
  type?: string
): ATSQuestion["type"] {
  switch (type) {
    case "String":
    case "Email":
    case "Phone":
    case "Url":
      return "text";
    case "LongText":
    case "RichText":
      return "textarea";
    case "ValueSelect":
    case "SingleSelect":
      return "select";
    case "MultiValueSelect":
    case "MultiSelect":
      return "multi_select";
    case "Boolean":
    case "Checkbox":
      return "boolean";
    case "File":
      return "file";
    default:
      return "text";
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
