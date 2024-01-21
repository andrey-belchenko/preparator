import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as inputCol from "../input/_collections";
import { Expression, Fields, Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
export function flows(useDefaultFilter: boolean): Flow[] {
  return [
    {
      isParallel: false,
      operation: [
        {
          comment: "Сбор всех пролетов по линии",
          input: inputCol.flow_changed_Tower_ext,
          output: thisCol.flow_LineSpan_forPostprocess,
          operationType: OperationType.replace,
          useDefaultFilter: useDefaultFilter,
          pipeline: new Pipeline()
            .group({ _id: "$lineId" })
            .entityId("_id")
            .inverseLookupChildrenOfType(
              "AccountPartLine",
              "AccountPartLine_Line"
            )
            .unwindEntity()
            .inverseLookupChildrenOfType(
              "LineSpan",
              "LineSpan_AccountPartLine",
              "ls"
            )
            .unwindEntity()
            .replaceRoot("$ls")
            .project({
              _id: "$id",
              startTower: {
                $ifNull: [
                  "$model.LineSpan_StartTower",
                  { $concat: ["$id", "begin"] },
                ],
              },
              endTower: {
                $ifNull: [
                  "$model.LineSpan_EndTower",
                  { $concat: ["$id", "end"] },
                ],
              },
              apl: "$model.LineSpan_AccountPartLine",
              withSource: {
                $or: [
                  "$model.LineSpan_isFromSubstation",
                  "$model.LineSpan_isFromSwitch",
                ],
              },
              withTarget: {
                $or: [
                  "$model.LineSpan_isToSubstation",
                  "$model.LineSpan_isToSwitch",
                ],
              },
              segment: "$model.LineSpan_ACLineSegment",
            })
            .build(),
        },
        {
          isParallel: true,
          operation: [
            {
              src: __filename,
              comment: "Заполнение поля LineSpan_isTapBegin",
              input: thisCol.flow_LineSpan_forPostprocess,
              output: sysCol.model_Input,
              operationType: OperationType.insert,
              useDefaultFilter: useDefaultFilter,
              pipeline: new Pipeline()
                .lookup({
                  from: thisCol.flow_LineSpan_forPostprocess,
                  localField: "startTower",
                  foreignField: "endTower",
                  as: "prevLs",
                })
                .unwind("$prevLs")
                .matchExpr({
                  $ne: [
                    "$apl",
                    {
                      $ifNull: ["$prevLs.apl", "$apl"],
                    },
                  ],
                })
                .project({
                  model: {
                    "@type": "LineSpan",
                    "@action": "update",
                    "@idSource": "platform",
                    "@id": "$_id",
                    LineSpan_isTapBegin: { $literal: true },
                  },
                })
                .build(),
            },
            {
              comment:
                "Заполнение полей для исключения неподключенных пролетов",
              isParallel: false,
              operation: [
                hasSrcTrgFlow(
                  useDefaultFilter,
                  "startTower",
                  "endTower",
                  "$withSource",
                  {
                    "item.hasSource": true,
                  }
                ),
                hasSrcTrgFlow(
                  useDefaultFilter,
                  "endTower",
                  "startTower",
                  "$withTarget",
                  {
                    "item.hasTarget": true,
                  }
                ),
                {
                  src: __filename,
                  input: thisCol.flow_LineSpan_forPostprocess,
                  output: sysCol.model_Input,
                  operationType: OperationType.insert,
                  useDefaultFilter: useDefaultFilter,
                  pipeline: new Pipeline()
                    .matchExpr({
                      $or: ["$segment", { $and: ["$hasTarget", "$hasSource"] }],
                    })
                    .project({
                      model: {
                        "@type": "LineSpan",
                        "@action": "update",
                        "@idSource": "platform",
                        "@id": "$_id",
                        LineSpan_isInUse: { $literal: true },
                      },
                    })
                    .build(),
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function hasSrcTrgFlow(
  useDefaultFilter: boolean,
  startEnd: string,
  endStart: string,
  filter: Expression,
  fields: Fields
) {
  return {
    src: __filename,
    input: thisCol.flow_LineSpan_forPostprocess,
    output: thisCol.flow_LineSpan_forPostprocess,
    operationType: OperationType.sync,
    useDefaultFilter: useDefaultFilter,
    pipeline: new Pipeline()
      .matchExpr(filter)
      .graphLookup({
        from: thisCol.flow_LineSpan_forPostprocess,
        startWith: "$" + endStart,
        connectFromField: endStart,
        connectToField: startEnd,
        restrictSearchWithMatch: { $expr: { $not: filter } },
        as: "ols",
      })
      .project({
        id: { $concatArrays: [["$_id"], "$ols._id"] },
      })
      .unwind("$id")
      .group({ _id: "$id" })
      .lookup({
        from: thisCol.flow_LineSpan_forPostprocess,
        localField: "_id",
        foreignField: "_id",
        as: "item",
      })
      .unwind("$item")
      .addFields(fields)
      .replaceRoot("$item")
      .build(),
  };
}
// utils.compileFlow(
//   ((flows(false)[0] as MultiStepFlow).operation[1] as MultiStepFlow)
//     .operation[1]
// );

// utils.compileFlows(flows(false));
