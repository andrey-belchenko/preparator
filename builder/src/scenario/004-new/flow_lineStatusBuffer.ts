import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";

import { compileFlow, compileObject } from "_sys/utils";

import { bufferPipelineSteps } from "scenario/004/out_Rgis";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_NodesStatus,
  output: thisCol.flow_lineStatusBuffer,
  operationType: OperationType.sync,
  mergeKey: "segmentId",
  pipeline: [
    {
      $lookup: {
        from: col.dm_Terminal,
        localField: "_id",
        foreignField: "model.Terminal_ConnectivityNode",
        as: "t",
      },
    },
    { $unwind: "$t" },
    {
      $lookup: {
        from: col.dm_ACLineSegment,
        localField: "t.model.Terminal_ConductingEquipment",
        foreignField: "id",
        as: "s",
      },
    },
    { $unwind: "$s" },
    {
      $group: {
        _id: "$s.model.Equipment_EquipmentContainer",
      },
    },
    {
      $lookup: {
        from: "dm_Line",
        localField: "_id",
        foreignField: "id",
        as: "line",
      },
    },
    { $unwind: "$line" },
    //lookup ACLineSegment
    {
      $addFields: {
        showSegment: true,
        showLineSpan: true,
      },
    },
    ...bufferPipelineSteps(),
  ],
};

// utils.compileFlow(flow);
