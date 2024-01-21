import { Flow, OperationType } from "_sys/classes/Flow";
import * as thisCol from "./_collections";

export const flow: Flow = {
  src: __filename,
  input: thisCol.in_NodesStatus,
  output: thisCol.flow_NodesStatus,
  operationType: OperationType.sync,
  pipeline: [
    {
      $project: {
        _id: "$connectivityNodeUid",
        value: "$value",
      },
    },
  ],
};


