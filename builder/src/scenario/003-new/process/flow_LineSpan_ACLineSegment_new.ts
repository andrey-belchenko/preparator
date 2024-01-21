import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
export const flow: Flow = {
  src: __filename,
  input: col.flow_LineSpan_buffer,
  output: thisCol.flow_LineSpan_ACLineSegment_new,
  operationType: OperationType.replace,
  pipeline: [
    //сбор всех пролетов по ACLS начиная с последнего пролета (по данным из промежуточной таблицы)
    { $match: { isLast: true } },
    {
      $graphLookup: {
        from: col.flow_LineSpan_buffer,
        startWith: "$_id",
        connectFromField: "prev",
        connectToField: "_id",
        depthField: "index",
        as: "lineSpan",
      },
    },
    {
      $addFields: {
        lsLastIndex: { $subtract: [{ $size: "$lineSpan" }, 1] },
      },
    },
    // Определение начального и конечного пролета
    {
      $addFields: {
        firstLs: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$lineSpan",
                as: "item",
                cond: { $eq: ["$$item.index", "$lsLastIndex"] },
              },
            },
            0,
          ],
        },
        lastLs: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$lineSpan",
                as: "item",
                cond: { $eq: ["$$item.index", 0] },
              },
            },
            0,
          ],
        },
      },
    },
    { $unwind: "$lineSpan" },
    // находим предыдущий пролет, чтобы достать КА, он нужен для дальнейшего построения связей между acls
    {
      $lookup: {
        from: col.flow_LineSpan_buffer,
        localField: "firstLs.anyPrev",
        foreignField: "_id",
        as: "prevLs",
      },
    },
    {
      $unwind: {
        path: "$prevLs",
        preserveNullAndEmptyArrays: true,
      },
    },
    // TODO: получается сильно денормализованный набор данных, это путает, перекомпоновать при возможности
    {
      $project: {
        _id: "$lineSpan._id",
        lineId: "$lineId",
        aclsId: { $concat: ["ACLineSegment", "$firstLs._id"] },
        lineSpanId: "$lineSpan._id",
        prevLsId: "$firstLs.anyPrev",
        firstLsId: "$firstLs._id",
        lastLsId: "$lastLs._id",
        firstTowerId: "$firstLs.model.LineSpan_StartTower",
        lastTowerId: "$lastLs.model.LineSpan_EndTower",
        isTap: "$firstLs.model.LineSpan_isTapBegin",
        swtch: "$lastLs.swtch",
        prevSwitch: {
          $cond: [
            { $eq: ["$prevLs.swtch.lineSpanId", "$lineSpan._id"] },
            "$prevLs.swtch",
            "$$REMOVE",
          ],
        },
        // prevSwitch: "$prevLs.swtch",
        baseVoltage: "$baseVoltage",
        isEndOfArea: "$isEndOfArea",
        isBeginOfArea: "$firstLs.isBeginOfArea",
      },
    },
  ],
};
