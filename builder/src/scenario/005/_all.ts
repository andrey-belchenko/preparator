import { Flow } from "_sys/classes/Flow";
import * as usagePoint from "./usagePoint";
import * as meter from "./meter";
export const flows: Flow[] = [usagePoint.flow, meter.flow];
