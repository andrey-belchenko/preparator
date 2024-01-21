import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Switches_stat_new,
  output: col.flow_Switches_stat_last,
  operationType: OperationType.replace,
  pipeline: [
    { $project: { value: true } }
  ],
}