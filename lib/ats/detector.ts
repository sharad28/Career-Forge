import type { ATSType, ATSDetection, MethodOption } from "./types";

const ATS_PATTERNS: Array<{
  type: ATSType;
  patterns: RegExp[];
  extractTokenAndId: (url: string) => { boardToken: string; jobId: string };
}> = [
  {
    type: "greenhouse",
    patterns: [
      /boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i,
      /([^/]+)\.greenhouse\.io.*?\/jobs\/(\d+)/i,
      /job-boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i,
    ],
    extractTokenAndId: (url: string) => {
      for (const pattern of [
        /boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i,
        /([^/]+)\.greenhouse\.io.*?\/jobs\/(\d+)/i,
        /job-boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i,
      ]) {
        const match = url.match(pattern);
        if (match) return { boardToken: match[1], jobId: match[2] };
      }
      return { boardToken: "", jobId: "" };
    },
  },
  {
    type: "lever",
    patterns: [
      /jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/i,
    ],
    extractTokenAndId: (url: string) => {
      const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/i);
      return match
        ? { boardToken: match[1], jobId: match[2] }
        : { boardToken: "", jobId: "" };
    },
  },
  {
    type: "ashby",
    patterns: [
      /jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]+)/i,
      /([^/]+)\.ashbyhq\.com.*?\/([a-f0-9-]+)/i,
    ],
    extractTokenAndId: (url: string) => {
      for (const pattern of [
        /jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]+)/i,
        /([^/]+)\.ashbyhq\.com.*?\/([a-f0-9-]+)/i,
      ]) {
        const match = url.match(pattern);
        if (match) return { boardToken: match[1], jobId: match[2] };
      }
      return { boardToken: "", jobId: "" };
    },
  },
];

function buildMethodOptions(
  computerUseEnabled: boolean
): MethodOption[] {
  return [
    {
      method: "computer-use",
      label: "Claude Computer Use",
      description: "Claude opens a browser and fills the application form for you",
      cost: "~$0.10 API cost",
      recommended: computerUseEnabled,
      available: computerUseEnabled,
      reason: computerUseEnabled
        ? undefined
        : "Enable Computer Use in Settings → Auto Apply Preferences",
    },
    {
      method: "manual",
      label: "Manual (Copy & Paste)",
      description: "AI generates your cover letter & Q&A — you paste it on the job page",
      cost: "Free",
      recommended: !computerUseEnabled,
      available: true,
    },
  ];
}

export function detectATS(
  url: string,
  computerUseEnabled: boolean = false
): ATSDetection {
  if (!url || !url.startsWith("http")) {
    return {
      atsType: "",
      boardToken: "",
      jobId: "",
      availableMethods: buildMethodOptions(computerUseEnabled),
    };
  }

  for (const ats of ATS_PATTERNS) {
    for (const pattern of ats.patterns) {
      if (pattern.test(url)) {
        const { boardToken, jobId } = ats.extractTokenAndId(url);
        return {
          atsType: ats.type,
          boardToken,
          jobId,
          availableMethods: buildMethodOptions(computerUseEnabled),
        };
      }
    }
  }

  // No ATS detected — still offer computer-use and manual
  return {
    atsType: "",
    boardToken: "",
    jobId: "",
    availableMethods: buildMethodOptions(computerUseEnabled),
  };
}

/**
 * Check if a URL looks like a known job portal (even if not a supported ATS)
 */
export function isJobUrl(url: string): boolean {
  if (!url) return false;
  const jobPatterns = [
    /greenhouse\.io/i,
    /lever\.co/i,
    /ashbyhq\.com/i,
    /myworkdayjobs\.com/i,
    /workday\.com.*\/job/i,
    /linkedin\.com\/jobs/i,
    /indeed\.com/i,
    /glassdoor\.com/i,
    /careers\./i,
    /jobs\./i,
    /\/careers\//i,
    /\/jobs\//i,
    /\/job\//i,
  ];
  return jobPatterns.some((p) => p.test(url));
}
