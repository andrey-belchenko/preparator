import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import { compileFlow, compileObject } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: col.in_ЗапросСостояниеЛЭП,
  output: col.out_skNodeStatusRequest,
  operationType: OperationType.insert,
  pipeline: [
    {
      $lookup: {
        from: "dm_Line",
        localField: "payload.Тело.КодТехническогоОбъекта",
        foreignField: "extId.КИСУР",
        as: "line",
      },
    },
    { $unwind: "$line" },
    {
      $lookup: {
        from: "dm_ACLineSegment",
        localField: "line.id",
        foreignField: "model.Equipment_EquipmentContainer",
        as: "segment",
      },
    },
    { $unwind: "$segment" },
    {
      $lookup: {
        from: "dm_Terminal",
        localField: "segment.id",
        foreignField: "model.Terminal_ConductingEquipment",
        as: "terminal",
      },
    },
    { $unwind: "$terminal" },
    {
      $match: { $expr: "$terminal.model.Terminal_ConnectivityNode" },
    },
    {
      $group: {
        _id: "$line.id",
        payload:{ $first: "$payload" },
        nodeIds: { $addToSet: "$terminal.model.Terminal_ConnectivityNode" },
      },
    },
    {
      $project: {
        _id: false,
        requestInfo:"$payload",
        nodeIds:true,
      },
    },
  ],
};

// compileObject(flow.pipeline)
// compileFlow(flow);

