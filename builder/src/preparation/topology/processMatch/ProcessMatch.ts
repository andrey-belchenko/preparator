import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import * as workCol from "scenario/003-new/input/_collections";
import * as utils from "_sys/utils";
import * as model_postprocess from "scenario/003-new/process/model_Line_postprocess";
import { Pipeline } from "_sys/classes/Pipeline";
import { pipeline as changedTowerPipeline } from "scenario/003-new/input/common/flow_ChangedTower";
import * as trig from "triggers";

function addFilterSteps(pipeline: Pipeline) {
  return pipeline
    .lookup({
      from: thisCol.affectedLines,
      localField: "l.id",
      foreignField: "id",
      as: "la",
    })
    .unwind("$la");
}

function filterLineSpans(idField: string): Pipeline {
  return addFilterSteps(
    new Pipeline()
      .entityId(idField)
      .lookupParent("LineSpan_AccountPartLine")
      .unwindEntity()
      .lookupParent("AccountPartLine_Line", "l")
      .unwindEntity()
  );
}

function filterAcls(): Pipeline {
  return addFilterSteps(
    new Pipeline()
      .entityId("id")
      .lookupParent("Equipment_EquipmentContainer", "l")
      .unwindEntity()
  );
}

function filterApl(): Pipeline {
  return addFilterSteps(
    new Pipeline()
      .entityId("id")
      .lookupParent("AccountPartLine_Line", "l")
      .unwindEntity()
  );
}

export const flow: MultiStepFlow = {
  trigger: trig.trigger_ProcessTopologyMatch,
  src: __filename,
  operation: [
    {
      src: __filename,
      input: thisCol.KISUR_SK11_LineSpanACLS,
      output: thisCol.affectedLines,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .group({ _id: "$КодЛинии" })
        .entityExtId("_id", "КИСУР", "Line")
        .lookupSelf("l")
        .unwindEntity()
        .project({
          code: "$_id",
          id: "$l.id",
        })
        .build(),
    },
    {
      src: __filename,
      input: col.dm_LineSpan,
      output: workCol.flow_changed_Tower_ext,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addStepsFromPipeline(filterLineSpans("id"))
        .addSteps(changedTowerPipeline)
        .build(),
    },
    ...model_postprocess.flows(false),
    endLineSpanOperation("Start", "End", "First"),
    endLineSpanOperation("End", "Start", "Last"),
    {
      comment: "Установка базового ключа для ACLineSegment",
      input: col.dm_ACLineSegment,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        ...filterAcls().build(),
        { $match: { $expr: "$model.ACLineSegment_FirstLineSpan" } },
        {
          $project: {
            model: {
              "@type": "ACLineSegment",
              "@lastSource": "keep",
              "@id": {
                platform: "$id",
                processor: {
                  $concat: [
                    "ACLineSegment",
                    "$model.ACLineSegment_FirstLineSpan",
                  ],
                },
              },
            },
          },
        },
      ],
    },
    {
      comment: "Установка базового ключа для Terminal",
      input: col.dm_ACLineSegment,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        ...filterAcls().build(),
        { $match: { $expr: "extId.processor" } },
        {
          $lookup: {
            localField: "id",
            from: col.dm_Terminal,
            foreignField: "model.Terminal_ConductingEquipment",
            as: "terminal",
          },
        },
        { $unwind: "$terminal" },
        {
          $project: {
            model: {
              "@type": "Terminal",
              "@lastSource": "keep",
              "@id": {
                platform: "$terminal.id",
                processor: {
                  $concat: [
                    "Terminal",
                    {
                      $cond: [
                        {
                          $eq: ["$terminal.model.Terminal_index", 1],
                        },
                        "$model.ACLineSegment_FirstLineSpan",
                        "$model.ACLineSegment_LastLineSpan",
                      ],
                    },
                    "-",
                    {
                      $toString: "$terminal.model.Terminal_index",
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
    {
      comment: "Установка базового ключа для ConnectivityNode",
      input: col.dm_ACLineSegment,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        ...filterAcls().build(),
        { $match: { $expr: "extId.processor" } },
        { $match: { $expr: "$model.ACLineSegment_LastLineSpan" } },
        {
          $lookup: {
            localField: "model.ACLineSegment_LastLineSpan",
            from: col.dm_LineSpan,
            foreignField: "id",
            as: "lastLs",
          },
        },
        { $unwind: "$lastLs" },
        {
          $addFields: {
            endTowerId: {
              $ifNull: ["$lastLs.model.LineSpan_EndTower", "-"],
            },
          },
        },
        {
          $lookup: {
            localField: "endTowerId",
            from: col.dm_LineSpan,
            foreignField: "model.LineSpan_StartTower",
            as: "nextLs",
          },
        },
        // таким образом убираются сегменты не имеющие следующего сегмента, т.е. не трогаем внешние ConnectivityNode
        { $unwind: "$nextLs" },
        {
          $lookup: {
            localField: "id",
            from: col.dm_Terminal,
            foreignField: "model.Terminal_ConductingEquipment",
            as: "terminal",
          },
        },
        { $unwind: "$terminal" },
        { $match: { "terminal.model.Terminal_index": 2 } },
        {
          $lookup: {
            localField: "terminal.model.Terminal_ConnectivityNode",
            from: col.dm_ConnectivityNode,
            foreignField: "id",
            as: "node",
          },
        },
        { $unwind: "$node" },

        {
          $project: {
            model: {
              "@type": "ConnectivityNode",
              "@lastSource": "keep",
              "@id": {
                platform: "$node.id",
                processor: {
                  $concat: [
                    "ConnectivityNode",
                    "$model.ACLineSegment_LastLineSpan",
                  ],
                },
              },
            },
          },
        },
      ],
    },
    {
      comment: "Установка базового ключа для Terminal на ком. аппаратах",
      input: col.model_Links,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ predicate: "Switch_LineSpan" })
        .addStepsFromPipeline(filterLineSpans("toId"))
        .entityId("fromId")
        .lookupSelf("sw")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConductingEquipment",
          "t"
        )
        .unwindEntity()
        .project({
          model: {
            "@type": "Terminal",
            "@lastSource": "keep",
            "@id": {
              platform: "$t.id",
              processor: {
                $concat: [
                  "Terminal",
                  "$sw.extId.processor",
                  "-",
                  { $toString: "$t.model.Terminal_index" },
                ],
              },
            },
          },
        })
        .build(),
    },
    {
      comment:
        "Установка базового ключа для ConnectivityNode на ком. аппаратах",
      input: col.model_Links,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ predicate: "Switch_LineSpan" })
        .addStepsFromPipeline(filterLineSpans("toId"))
        .entityId("fromId")
        .lookupSelf("sw")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConductingEquipment",
          "t"
        )
        .unwindEntity()
        .matchExpr({ $eq: ["$t.model.Terminal_index", 2] })
        .lookupParentOfType(
          "ConnectivityNode",
          "Terminal_ConnectivityNode",
          "n"
        )
        .unwindEntity()
        .project({
          model: {
            "@type": "ConnectivityNode",
            "@lastSource": "keep",
            "@id": {
              platform: "$n.id",
              processor: {
                $concat: ["ConnectivityNode", "$sw.extId.processor"],
              },
            },
          },
        })
        .build(),
    },
    {
      comment:
        "Установка номинального напряжения для AccountPartLine по  номинальному напряжению сегмента",
      input: col.dm_AccountPartLine,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addStepsFromPipeline(filterApl())
        .matchExpr({ $not: "$model.AccountPartLine_BaseVoltage" })
        .entityId("id")
        .inverseLookupChildrenOfType("LineSpan", "LineSpan_AccountPartLine")
        .unwindEntity()
        .lookupParent("LineSpan_ACLineSegment", "s")
        .unwindEntity()
        .lookupParent("ConductingEquipment_BaseVoltage", "v")
        .unwindEntity()
        .group({
          _id: "$id",
          baseVoltage: { $first: "$v.id" },
        })
        .project({
          model: {
            "@type": "AccountPartLine",
            "@id": "$_id",
            "@idSource": "platform",
            "@lastSource": "keep",
            AccountPartLine_BaseVoltage: {
              "@lastSource": "keep",
              "@type": "BaseVoltage",
              "@id": "$baseVoltage",
              "@idSource": "platform",
            },
          },
        })
        .build(),
    },
  ],
};

function endLineSpanOperation(
  startEnd: string,
  endStart: string,
  firstLast: string
): SingleStepFlow {
  const model = {
    "@type": "ACLineSegment",
    "@id": "$aclsId",
    "@idSource": "platform",
    "@lastSource": "keep",
  };
  model[`ACLineSegment_${firstLast}LineSpan`] = {
    "@type": "LineSpan",
    "@lastSource": "keep",
    "@id": "$id",
  };
  if (startEnd == "Start") {
    model["ACLineSegment_isTap"] = "$model.LineSpan_isTapBegin";
    model["@action"] = "update";
  }
  return {
    comment: `Заполнение поля ACLineSegment_${firstLast}LineSpan`,
    input: col.dm_LineSpan,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    useDefaultFilter: false,
    pipeline: new Pipeline()
      .entityId("id")
      .addStepsFromPipeline(filterLineSpans("id"))
      .addSteps([
        { $match: { $expr: "$model.LineSpan_ACLineSegment" } },
        {
          $addFields: {
            towerId: {
              $ifNull: [`$model.LineSpan_${startEnd}Tower`, "-"],
            },
            aclsId: {
              $ifNull: ["$model.LineSpan_ACLineSegment", "-"],
            },
          },
        },
        {
          $lookup: {
            from: col.dm_LineSpan,
            localField: "towerId",
            foreignField: `model.LineSpan_${endStart}Tower`,
            as: "other",
          },
        },
        {
          $unwind: {
            path: "$other",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $expr: {
              $ne: [
                "$aclsId",
                { $ifNull: ["$other.model.LineSpan_ACLineSegment", "-"] },
              ],
            },
          },
        },
        {
          $project: {
            _id: false,
            model: model,
          },
        },
      ])
      .build(),
  };
}

// utils.compileFlow(flow.operation[flow.operation.length - 1]);

// utils.compileFlow(endLineSpanOperation("Start", "End", "First"));
