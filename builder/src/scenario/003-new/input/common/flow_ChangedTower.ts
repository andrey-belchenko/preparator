import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import { Flow, OperationType } from "_sys/classes/Flow";

export const pipeline = [
  //изначально формирование было по dm_Tower, потом переключил на dm_LineSpan т.к. КА теперь не ссылается на опору
  {
    $project: {
      towerId: ["$model.LineSpan_StartTower", "$model.LineSpan_EndTower"],
      aplId: "$model.LineSpan_AccountPartLine",
      // приходится химичить чтобы потом достать сегменты по удаленным пролетам
      aclsId: "$model.LineSpan_ACLineSegment",
    },
  },
  {
    $unwind: "$towerId",
  },
  {
    $group: {
      _id: "$towerId",
      aplId: { $first: "$aplId" },
      aclsId: { $first: "$aclsId" },
    },
  },
  { $match: { $expr: "$_id" } },
  {
    $lookup: {
      localField: "_id",
      from: col.dm_Tower,
      foreignField: "id",
      as: "t",
    },
  },
  { $unwind: "$t" },
  ///
  {
    $lookup: {
      localField: "aplId",
      from: col.dm_AccountPartLine,
      foreignField: "id",
      as: "apl",
    },
  },
  { $unwind: "$apl" },
  {
    $project: {
      _id: "$_id",
      code: "$t.extId.КИСУР",
      lineId: "$apl.model.AccountPartLine_Line",
      aclsId: "$aclsId",
    },
  },
];

export const flow: Flow = {
  src: __filename,
  input: col.dm_LineSpan,
  output: thisCol.flow_changed_Tower,
  operationType: OperationType.sync,
  pipeline: pipeline,
};
