import {
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";

export const flow: MultiStepFlow = {
  src: __filename,
  comment: "Все объекты в виде дерева по связям IdentifiedObject.ParentObject",
  trigger: sysCol.model_Entities,
  operation: [
    {
      input: sysCol.model_Entities,
      output: thisCol.view_objectTreeWithStat,
      operationType: OperationType.syncWithDelete,
      mergeKey: "id",
      pipeline: new Pipeline()
        // .matchExpr({ $not: "$deletedAt" })
        // .match({ initialId: "2fafae17-4e38-4c22-bbf6-03e56a5b2a14" })
        .matchExpr("$type")
        .matchExpr({
          $not: {
            $in: [
              "$type",
              [
                // todo возможно некоторые из исключенных объектов все же нужны, тогда можно прописать алгоритм определения родителя в правилах для них и исключить их этого фильтра
                "TechPlace",
                "PsrFile",
                "ControlArea",
                "SDAccountLink",
                "SDPointRole",
                "PositionPoint",
                "Customer",
                "Voltage",
                "Seal",
                "CurrentFlow",
                "MeterInfo",
                "MeterMultiplierKind",
                "Tower"
              ],
            ],
          },
        })
        .lookup({
          from: sysCol.model_Links,
          let: {
            it: "$$ROOT",
          },
          pipeline: new Pipeline()
            .matchExpr({ $eq: ["$fromId", "$$it.initialId"] })
            .match({ predicate: "IdentifiedObject_ParentObject" })
            .build(),
          as: "p",
        })
        .unwind({ path: "$p", preserveNullAndEmptyArrays: true })
        .lookup({
          from: sysCol.model_Links,
          let: {
            it: "$$ROOT",
          },
          pipeline: new Pipeline()
            .matchExpr({ $eq: ["$toId", "$$it.initialId"] })
            .match({ predicate: "IdentifiedObject_ParentObject" })
            .build(),
          as: "c",
        })
        .entityId("initialId")
        .lookupParentWithDeleted("IdentifiedObject_RootContainer", "rc")
        .unwindEntity(true)
        .lookupParentWithDeleted(["Line_Region", "Substation_Region"], "r")
        .unwindEntity(true)
        .entityId("initialId")
        .inverseLookupChildrenOfType("PsrFile", "PsrFile_psr", "f")
        .addFields({
          skIsActual: {
            $cond: ["$rc", { $eq: ["$lastSource", "sk11"] }, null],
          },
        })
        .project({
          id: "$initialId",
          parent: "$p.toId",
          name: { $ifNull: ["$model.IdentifiedObject_name", "$initialId"] },
          type: "$type",
          entityCreatedAt: "$createdAt",
          entityChangedAt: "$changedAt",
          entityDeletedAt: "$deletedAt",
          skLoadedAt: "$attr.skLoadedAt",
          skIsActual: "$skIsActual",
          ccsCode: "$model.PowerSystemResource_ccsCode",
          baseCode: { $ifNull: ["$extId.КИСУР", "$extId.processor"] },
          hasChildren: { $gt: [{ $size: "$c" }, 0] },
          rcType: "$rc.type",
          rcCode: "$rc.model.PowerSystemResource_ccsCode",
          rcName: "$rc.model.IdentifiedObject_name",
          region: "$r.model.IdentifiedObject_name",
          filesCount: { $size: "$f" },
          // если удаление подтверждено по данным СК или объект "новый" (не был в актуальной версии , attr.skLoadedAt - пусто), то удаляем запись из витрины
          deletedAt: {
            $cond: [
              { $or: ["$skIsActual", { $not: "$attr.skLoadedAt" }] },
              "$deletedAt",
              "$$REMOVE",
            ],
          },
        })
        .build(),
    },
    // убрал для производительности, можно вернуть если понадобится
    // {
    //   comment: "Статистика по дереву объектов",
    //   input: thisCol.view_objectTree,
    //   output: thisCol.view_objectTreeStat,
    //   operationType: OperationType.sync,
    //   mergeKey: "id",
    //   pipeline: new Pipeline()
    //     .addFields({
    //       count: 1,
    //       countCcsObjects: {
    //         $cond: [
    //           {
    //             $in: [
    //               "$type",
    //               [
    //                 "Line",
    //                 "Substation",
    //                 "Bay",
    //                 "Breaker",
    //                 "BusbarSection",
    //                 "CurrentTransformer",
    //                 "Disconnector",
    //                 "Recloser",
    //                 "Fuse",
    //                 "GroundDisconnector",
    //                 "NonConformLoad",
    //                 "PotentialTransformer",
    //                 "PowerTransformer",
    //                 "SurgeArrester",
    //                 "VoltageLevel",
    //                 // "Junction",
    //                 // "FuseSwitchDisconnector",
    //                 // "LoadBreakSwitch",
    //                 // "Jumper",
    //                 // "KnifeSwitch",
    //                 // "ConformLoad",
    //                 // "PetersenCoil",
    //                 // "LinearShuntCompensator",
    //                 // "RatioTapChanger"
    //               ],
    //             ],
    //           },
    //           1,
    //           0,
    //         ],
    //       },
    //     })
    //     .addFields({
    //       countMatchedCcsObjects: {
    //         $cond: [
    //           {
    //             $and: ["$countCcsObjects", "$baseCode"],
    //           },
    //           1,
    //           0,
    //         ],
    //       },
    //     })
    //     .addFields({
    //       countUnmatchedCcsObjects: {
    //         $cond: [
    //           {
    //             $and: ["$countCcsObjects", { $not: "$baseCode" }],
    //           },
    //           1,
    //           0,
    //         ],
    //       },
    //     })
    //     .graphLookup({
    //       from: thisCol.view_objectTree,
    //       startWith: "$id",
    //       connectFromField: "parent",
    //       connectToField: "id",
    //       as: "p",
    //     })
    //     .unwind("$p")
    //     .group({
    //       _id: "$p.id",
    //       count: { $sum: "$count" },
    //       countCcsObjects: { $sum: "$countCcsObjects" },
    //       countMatchedCcsObjects: { $sum: "$countMatchedCcsObjects" },
    //       countUnmatchedCcsObjects: { $sum: "$countUnmatchedCcsObjects" },
    //     })
    //     .addFields({
    //       id: "$_id",
    //       _id: "$$REMOVE",
    //     })
    //     .build(),
    // },
    // {
    //   comment: "Дерево объектов со статистикой",
    //   input: thisCol.view_objectTree,
    //   output: thisCol.view_objectTreeWithStat,
    //   operationType: OperationType.sync,
    //   mergeKey: "id",
    //   pipeline: new Pipeline()
    //     .project({
    //       it: "$$ROOT",
    //     })
    //     .lookup({
    //       from: thisCol.view_objectTreeStat,
    //       localField: "it.id",
    //       foreignField: "id",
    //       as: "stat",
    //     })
    //     .unwind({ path: "$stat", preserveNullAndEmptyArrays: true })
    //     .addFields({
    //       "it.stat.count": "$stat.count",
    //       "it.stat.countCcsObjects": "$stat.countCcsObjects",
    //       "it.stat.countMatchedCcsObjects": "$stat.countMatchedCcsObjects",
    //       "it.stat.countUnmatchedCcsObjects": "$stat.countUnmatchedCcsObjects",
    //     })
    //     .replaceRoot("$it")
    //     .build(),
    // },
  ],
};

// utils.compileFlow(flow.operation[0]);
