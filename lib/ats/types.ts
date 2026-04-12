export type ATSType = "greenhouse" | "lever" | "ashby";
export type ApplyMethod = "computer-use" | "manual";

export interface ATSDetection {
  atsType: ATSType | "";
  boardToken: string;
  jobId: string;
  availableMethods: MethodOption[];
}

export interface MethodOption {
  method: ApplyMethod;
  label: string;
  description: string;
  cost: string;
  recommended: boolean;
  available: boolean;
  reason?: string;
}

export interface ATSQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file" | "boolean" | "multi_select";
  required: boolean;
  options?: string[];
}

export interface ATSJob {
  title: string;
  company: string;
  description: string;
  location: string;
  url: string;
  questions: ATSQuestion[];
}

export interface ATSAdapter {
  fetchJob(boardToken: string, jobId: string): Promise<ATSJob>;
}
