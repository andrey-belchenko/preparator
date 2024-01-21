import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_old,
  output: thisCol.flow_Terminal_old,
  operationType: OperationType.replace,
  pipeline: [
    ...new Pipeline()
      .entityId("platformId")
      .lookupChildren("ConductingEquipment_Terminals", "terminal")
      .unwindEntity()
      .lookupParent("Terminal_ConnectivityNode", "node")
      .unwindEntity(true)
      .group({ _id: "$terminal.id", first: { $first: "$$ROOT" } })
      .project({
        _id: "$first.terminal.extId.processor",
        platformId: "$first.terminal.id",
        sequenceNumber: "$first.terminal.model.ACDCTerminal_sequenceNumber",
        equipmentProcessorId: "$first._id",
        equipmentPlatformId: "$first.platformId",
        nodeProcessorId: "$first.node.extId.processor",
        nodePlatformId: "$first.node.id",
      })
      .build(),
    // TODO: доделать КА
    // {
    //   $lookup: {
    //     localField: "platformId",
    //     from: col.dm_Terminal,
    //     foreignField: "model.Terminal_ConductingEquipment",
    //     as: "terminal",
    //   },
    // },
    // { $unwind: "$terminal" },
    // {
    //   $lookup: {
    //     localField: "terminal.model.Terminal_ConnectivityNode",
    //     from: col.dm_ConnectivityNode,
    //     foreignField: "id",
    //     as: "node",
    //   },
    // },
    // {
    //   $unwind: {
    //     path: "$node",
    //     preserveNullAndEmptyArrays: true,
    //   },
    // },
    // {
    //   $group: {
    //     _id: "$terminal.id",
    //     first: { $first: "$$ROOT" },
    //   },
    // },
    // {
    //   $project: {
    //     _id: "$first.terminal.extId.processor",
    //     platformId: "$first.terminal.id",
    //     equipmentProcessorId: "$first._id",
    //     equipmentPlatformId: "$first.platformId",
    //     nodeProcessorId: "$first.node.extId.processor",
    //     nodePlatformId: "$first.node.id",
    //   },
    // },
  ],
};

// utils.compileFlow(flow);
