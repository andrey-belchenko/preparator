import * as segment from "./segment/_all";
import * as segmentDelete from "./segmentDelete/_all";
import * as switchDelete from "./switchDelete/_all";
import * as swtch from "./swtch/_all";
import { Flow } from "_sys/classes/Flow";

export const flows: Flow[] = [
  ...segment.flows,
  ...swtch.flows,
  ...segmentDelete.flows,
  ...switchDelete.flows
];
