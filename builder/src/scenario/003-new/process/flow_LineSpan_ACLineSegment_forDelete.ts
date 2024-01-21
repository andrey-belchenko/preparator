import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_LineSpan_ACLineSegment_old,
  output: thisCol.flow_LineSpan_ACLineSegment_forDelete,
  operationType: OperationType.replace,
  // TODO: не проверено
  pipeline: [
    {
      $lookup: {
        from: thisCol.flow_LineSpan_ACLineSegment_new,
        localField: "_id",
        foreignField: "_id",
        as: "new",
      },
    },
    {
      $match: {
        $expr: {
          $eq: [{ $size: "$new" }, 0],
        },
      },
    },
    {
      $unset: "new",
    },
  ],
};
