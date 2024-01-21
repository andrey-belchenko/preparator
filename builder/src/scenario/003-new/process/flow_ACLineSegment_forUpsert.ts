import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_new,
  output: thisCol.flow_ACLineSegment_forUpsert,
  operationType: OperationType.replace,
  pipeline: [
    {
      $match: {
        isSwitch: false,
      },
    },
    {
      $lookup: {
        from: thisCol.flow_ACLineSegment_name,
        localField: "_id",
        foreignField: "_id",
        as: "name",
      },
    },
    {
      $unwind: {
        path: "$name",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: thisCol.flow_ACLineSegment_data,
        localField: "_id",
        foreignField: "_id",
        as: "data",
      },
    },
    {
      $unwind: {
        path: "$data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: thisCol.flow_ACLineSegment_old,
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
        $expr: {
          $or: [
            { $ne: ["$name.name", "$oldItem.name"] },
            { $ne: ["$data.length", "$oldItem.length"] },
            { $ne: ["$firstLsId", "$oldItem.firstLsId"] },
            { $ne: ["$lastLsId", "$oldItem.lastLsId"] },
            { $ne: ["$baseVoltage", "$oldItem.baseVoltage"] },
          ],
        },
      },
    },
    {
      $addFields: {
        oldId: "$oldItem._id",
      },
    },
    {
      $unset: ["oldItem", "name", "data"],
    },
  ],
};
