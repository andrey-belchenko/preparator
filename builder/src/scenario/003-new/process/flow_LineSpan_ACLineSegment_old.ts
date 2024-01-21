import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_old,
  output: thisCol.flow_LineSpan_ACLineSegment_old,
  operationType: OperationType.replace,
  pipeline: [
    {
      $lookup: {
        from: col.dm_LineSpan,
        localField: "platformId",
        foreignField: "model.LineSpan_ACLineSegment",
        as: "ls",
      },
    },
    { $unwind: "$ls" },
    {
      $project: {
        _id: "$ls.id",
        aclsId: "$_id",
      },
    },
  ],
};

// compileFlow(flow)
