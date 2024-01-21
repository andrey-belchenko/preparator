import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_Terminal_new,
  output: thisCol.flow_Terminal_forUpsert,
  operationType: OperationType.replace,
  pipeline: [
    {
      $lookup: {
        from: thisCol.flow_Terminal_old,
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
    // {
    //   $match: { $expr: "$nodeProcessorId" },
    // },
    {
      $match: {
        $expr: {
          $or: [
            { $ne: ["$nodeProcessorId", "$oldItem.nodeProcessorId"] },
            { $ne: ["$nodePlatformId", "$oldItem.nodePlatformId"] },
            { $ne: ["$equipmentProcessorId", "$oldItem.equipmentProcessorId"] },
          ],
        },
      },
    },
    {
      $addFields: {
        oldId: "$oldItem._id",
        oldNodeProcessorId: "$oldItem.nodeProcessorId",
      },
    },
    {
      $unset: "oldItem",
    },
  ],
};
