import { Flow, OperationType } from "_sys/classes/Flow";
import * as loadMatch from "./loadMatch/_all";
import * as processMatch from "./processMatch/_all";
import * as loadKisurData from "./loadKisurData/_all";
import * as check from "./check/_all";

export const flows: Flow[] = [
  ...loadKisurData.flows,
  ...loadMatch.flows,
  ...processMatch.flows,
  ...check.flows,
];
