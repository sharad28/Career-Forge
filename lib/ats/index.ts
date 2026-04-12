import type { ATSAdapter, ATSType } from "./types";
import { GreenhouseAdapter } from "./greenhouse";
import { LeverAdapter } from "./lever";
import { AshbyAdapter } from "./ashby";

export { detectATS, isJobUrl } from "./detector";
export type { ATSDetection, MethodOption, ATSType, ApplyMethod, ATSJob, ATSQuestion, ATSAdapter } from "./types";

const adapters: Record<ATSType, ATSAdapter> = {
  greenhouse: new GreenhouseAdapter(),
  lever: new LeverAdapter(),
  ashby: new AshbyAdapter(),
};

export function getAdapter(atsType: ATSType): ATSAdapter {
  const adapter = adapters[atsType];
  if (!adapter) {
    throw new Error(`No adapter for ATS type: ${atsType}`);
  }
  return adapter;
}

export function hasAdapter(atsType: string): atsType is ATSType {
  return atsType in adapters;
}
