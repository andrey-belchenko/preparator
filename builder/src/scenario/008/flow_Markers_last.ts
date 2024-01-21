import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Markers_new,
  output: col.flow_Markers_last,
  operationType: OperationType.replace,
  pipeline: [
    { $project: { value: true } }
  ],
}