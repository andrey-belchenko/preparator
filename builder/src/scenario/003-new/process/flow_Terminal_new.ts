import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_new,
  output: thisCol.flow_Terminal_new,
  operationType: OperationType.replace,
  pipeline: [
    {
      $project: {
        item: [
          {
            lsId: "$firstLsId",
            processorId: "$startTerminalId",
            number: { $literal: 1 },
            processorNodeId: "$startNodeId",
            isBorderOfArea: "$isBeginOfArea"
            // otherTerminalId: "$prevSwitch.endTerminalId"
          },
          {
            lsId: "$lastLsId",
            processorId: "$endTerminalId",
            number: { $literal: 2 },
            processorNodeId: "$endNodeId",
            isBorderOfArea: "$isEndOfArea",
            // otherTerminalId: "$swtch.startTerminalId"
          },
        ],
      },
    },
    { $unwind: "$item" },
    {
      $lookup: {
        localField: "item.processorNodeId",
        from: thisCol.flow_ConnectivityNode_new,
        foreignField: "_id",
        as: "newNode",
      },
    },
    {
      $unwind: {
        path: "$newNode",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        localField: "item.processorId",
        from: thisCol.flow_Terminal_old,
        foreignField: "_id",
        as: "oldTerminal",
      },
    },
    {
      $unwind: {
        path: "$oldTerminal",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$item.processorId",
        number: "$item.number",
        sequenceNumber: {
          $ifNull: ["$oldTerminal.sequenceNumber", "$item.number"],
        },
        lsId: "$item.lsId",
        platformId: "$oldTerminal.platformId",
        equipmentProcessorId: "$_id",
        nodeProcessorId: "$newNode._id",
        nodePlatformId: "$oldTerminal.nodePlatformId",
        isBorderOfArea: "$item.isBorderOfArea",
      },
    },
  ],
};

// compileFlow(flow)
