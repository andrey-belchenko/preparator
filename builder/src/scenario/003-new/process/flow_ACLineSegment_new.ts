import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import { Pipeline } from "_sys/classes/Pipeline";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_LineSpan_ACLineSegment_new,
    output: thisCol.flow_ACLineSegment_new,
    operationType: OperationType.replace,
    pipeline: [
      {
        $group: {
          _id: "$aclsId",
          first: { $first: "$$ROOT" },
          prevSwitch: { $max: "$prevSwitch" },
        },
      },
      {
        $project: {
          _id: "$first.aclsId",
          lineId: "$first.lineId",
          prevLsId: "$first.prevLsId",
          firstLsId: "$first.firstLsId",
          lastLsId: "$first.lastLsId",
          swtch: "$first.swtch",
          prevSwitch: "$prevSwitch",
          firstTowerId: "$first.firstTowerId",
          lastTowerId: "$first.lastTowerId",
          isTap: "$first.isTap",
          baseVoltage:"$first.baseVoltage",
          isEndOfArea: "$first.isEndOfArea",
          isBeginOfArea: "$first.isBeginOfArea"
        },
      },

      {
        $addFields: {
          startNodeId: {
            $cond: [
              "$prevSwitch",
              {
                $concat: ["ConnectivityNode", "$prevSwitch.id"],
              },
              {
                $cond: [
                  "$prevLsId",
                  {
                    $concat: ["ConnectivityNode", "$prevLsId"],
                  },
                  "-",
                ],
              },
            ],
          },
          endNodeId: {
            $concat: ["ConnectivityNode", "$lastLsId"],
          },
          startTerminalId: {
            $concat: ["Terminal", "$firstLsId", "-1"],
          },
          endTerminalId: {
            $concat: ["Terminal", "$lastLsId", "-2"],
          },
          isSwitch: { $literal: false },
        },
      },
    ],
  },
  // информация по КА добаляется отдельными записями
  {
    src: __filename,
    input: thisCol.flow_ACLineSegment_new,
    output: thisCol.flow_ACLineSegment_new,
    operationType: OperationType.insert,
    pipeline: new Pipeline()
      .matchExpr("$prevSwitch")
      .project({
        _id: "$prevSwitch.id",
        lineId: "$lineId",
        prevLsId: "$prevLsId",
        startNodeId: {
          $concat: ["ConnectivityNode", "$prevLsId"],
        },
        endNodeId: {
          $concat: ["ConnectivityNode", "$prevSwitch.id"],
        },
        startTerminalId: "$prevSwitch.startTerminalId",
        endTerminalId: "$prevSwitch.endTerminalId",
        isSwitch: { $literal: true },
      })
      .group({
        _id: "_id",
        first: { $first: "$$ROOT" },
      })
      .replaceRoot("$first")
      .build(),
  },
];
