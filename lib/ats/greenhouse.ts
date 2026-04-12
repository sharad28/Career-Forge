import type { ATSAdapter, ATSJob, ATSQuestion } from "./types";

// Greenhouse public job board API.
// Actual question structure returned by the API:
// {
//   "label": "First Name",
//   "required": true,
//   "fields": [{ "name": "first_name", "type": "input_text", "values": [] }]
// }
// The "name" used in form submission comes from fields[0].name, NOT the top-level key.

interface GHField {
  name: string;
  type: string;
  values: Array<{ value?: string; label?: string }>;
}

interface GHQuestion {
  label?: string;
  required?: boolean;
  fields?: GHField[];
}

export class GreenhouseAdapter implements ATSAdapter {
  async fetchJob(boardToken: string, jobId: string): Promise<ATSJob> {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}?questions=true`
    );
    if (!res.ok) {
      throw new Error(
        `Greenhouse API error: ${res.status} — board "${boardToken}", job "${jobId}". The job may be private or expired.`
      );
    }
    const data = await res.json();

    // Each question may have multiple fields (e.g. multi-part questions).
    // Flatten them so every field becomes one ATSQuestion with its correct name.
    const questions: ATSQuestion[] = [];
    for (const q of (data.questions || []) as GHQuestion[]) {
      const fields = q.fields || [];
      if (fields.length === 0) continue;
      for (const field of fields) {
        questions.push({
          id: field.name,                        // form field name used in POST
          label: q.label || field.name,
          type: mapFieldType(field.type),
          required: q.required || false,
          options: field.values.map((v) => v.label || v.value || ""),
        });
      }
    }

    return {
      title: data.title || "",
      company: data.company?.name || boardToken,
      description: stripHtml(data.content || ""),
      location: data.location?.name || "",
      url: data.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${jobId}`,
      questions,
    };
  }

}

function mapFieldType(type?: string): ATSQuestion["type"] {
  switch (type) {
    case "input_text":
    case "short_text":
      return "text";
    case "textarea":
    case "long_text":
      return "textarea";
    case "multi_value_single_select":
    case "single_select":
      return "select";
    case "multi_value_multi_select":
    case "multi_select":
      return "multi_select";
    case "boolean":
      return "boolean";
    case "input_file":
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
