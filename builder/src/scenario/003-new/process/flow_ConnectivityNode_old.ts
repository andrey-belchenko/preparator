import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_Terminal_old,
  output: thisCol.flow_ConnectivityNode_old,
  operationType: OperationType.replace,
  pipeline: [

     // Находим соседние связи
    {
      $match:{$expr: "$nodePlatformId"}
    },
    {
      $lookup: {
        localField: "nodePlatformId",
        from: col.dm_Terminal,
        foreignField: "model.Terminal_ConnectivityNode",
        as: "nextTerminal",
      },
    },
    { $unwind: "$nextTerminal" },
    // Проверяем входит ли соседний объект в наш набор ACLS или это внешний объект
    {
      $lookup: {
        localField: "nextTerminal.model.Terminal_ConductingEquipment",
        from: thisCol.flow_ACLineSegment_old,
        foreignField: "platformId",
        as: "nextEquipment",
      },
    },
    {
      $addFields: {
        externalConnectionCount: {
          $cond: [{ $eq: [{ $size: "$nextEquipment" }, 0] }, 1, 0],
        },
      },
    },
    {
      $group: {
        _id: "$nodePlatformId",
        externalConnectionCount: { $sum: "$externalConnectionCount" },
        processorId:{$first:"$nodeProcessorId"}
      },
    },
    // Оставляем только узлы без внешних связей (внешние на трогаем)
    {
        $match:{externalConnectionCount:0}
    },
    {
      $project: {
        _id: "$processorId",
        platformId:"$_id",
      },
    },
  ],
};

// compileFlow(flow)
