import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_LineSpan_ACLineSegment_new,
  output: thisCol.flow_LineSpan_ACLineSegment_forUpsert,
  operationType: OperationType.replace,
  pipeline: [
    {
      $lookup: {
        from: thisCol.flow_LineSpan_ACLineSegment_old,
        localField: "_id",
        foreignField: "_id",
        as: "oldItem",
      },
    },
    {
      $unwind: {
        path: "$oldItem",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: { $ne: ["$aclsId", "$oldItem.aclsId"] },
      },
    },
    {
      $addFields: {
        oldId: "$oldItem._id",
      },
    },
    {
      $unset: "oldItem",
    },
  ],
};

// compileFlow(flow)