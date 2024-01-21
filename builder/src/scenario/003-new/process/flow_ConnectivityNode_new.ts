import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_new,
  output: thisCol.flow_ConnectivityNode_new,
  operationType: OperationType.replace,
  pipeline: [
    {
      $match: { $expr: "$prevLsId" },
    },
    {
      $group: {
        _id: "$startNodeId",
        lineId: { $first: "$lineId" },
      },
    },
    // {
    //   $project: {
    //     lineId: "$lineId",
    //     nodeId: ["$startNodeId", "$endNodeId"],
    //   },
    // },
    // {
    //   $unwind: "$nodeId",
    // },
    // {
    //   $group: {
    //     _id: "$nodeId",
    //     lineId: { $first: "$lineId" },
    //   },
    // },
  ],
};

// compileFlow(flow)
