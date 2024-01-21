import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ConnectivityNode_new,
  output: thisCol.flow_ConnectivityNode_forUpsert,
  operationType: OperationType.replace,
  pipeline: [
    {
      $lookup: {
        from: thisCol.flow_ConnectivityNode_old,
        localField: "_id",
        foreignField: "_id",
        as: "old",
      },
    },
    {
      $unwind: {
        path: "$old",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $expr: { $ne: ["$_id", "$old._id"] },
      },
    },
    {
      $unset: "old",
    },
  ],
};
