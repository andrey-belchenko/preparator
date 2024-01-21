import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import * as utils from "_sys/utils";
// import * as thisUtils from "../loadKisurData/_utils";
import { fakeCode } from "scenario/003-new/process/_utils";
import { Expression, Pipeline } from "_sys/classes/Pipeline";
export const flow: MultiStepFlow = {
  src: __filename,
  trigger: thisCol.KISUR_SK11_LineSpanACLS,
  operation: [
    {
      isParallel: false,
      operation: [
        {
          comment: "Загрузка сопоставления ACLineSegment-LineSpan",
          input: thisCol.KISUR_SK11_LineSpanACLS,
          output: sysCol.model_Input,
          operationType: OperationType.insert,
          useDefaultFilter: false,
          pipeline: new Pipeline()
            .matchExpr({ $ne: ["$ФиктивныйACLS", "true"] })
            .entityExtId("Пролет", "КИСУР", "LineSpan")
            .lookupSelf()
            .unwindEntity()
            .entityId("uidACLS", "ACLineSegment")
            .lookupSelf()
            .unwindEntity()
            .project({
              model: {
                "@type": "LineSpan",
                "@action": "update",
                "@id": "$Пролет",
                "@idSource": "КИСУР",
                "@lastSource": "keep",
                LineSpan_ACLineSegment: {
                  "@idSource": "platform",
                  "@type": "ACLineSegment",
                  "@id": "$uidACLS",
                  "@lastSource": "keep",
                },
              },
            })
            .build(),
        },
        {
          input: thisCol.KISUR_SK11_LineSpanACLS,
          output: sysCol.model_Input,
          operationType: OperationType.insert,
          useDefaultFilter: false,
          comment:
            "Связь фиктивных пролетов с фиктивными сегментами тип 1 (ПС)",
          pipeline: new Pipeline()
            .match({ ФиктивныйACLS: "true" })
            .lookup({
              from: thisCol.KISUR_SubstationLinkSpanTower,
              localField: "ОборудованиеПодстанции",
              foreignField: "ОборудованиеПодстанции",
              as: "ols",
            })
            .unwind("$ols")
            .project({
              model: {
                "@type": "LineSpan",
                "@action": "update",
                "@id": fakeCode("ols.Пролет", 1),
                "@idSource": "КИСУР",
                "@lastSource": "keep",
                LineSpan_ACLineSegment: {
                  "@idSource": "platform",
                  "@type": "ACLineSegment",
                  "@id": "$uidACLS",
                  "@lastSource": "keep",
                },
              },
            })
            .build(),
        },
      ],
    },
    {
      comment: "Установка признака НЕ сопоставленной линии",
      input: col.dm_Line,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .entityId("id")
        .entityAggregate(
          "x",
          new Pipeline()
            .entityId("id")
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
            .matchExpr("$ls.model.LineSpan_ACLineSegment")
            .group({ _id: true })
            .project({
              hasMatched: "_id",
            })
        )
        .unwind({ path: "$x", preserveNullAndEmptyArrays: true })
        .project({
          model: {
            "@action": "update",
            "@type": "Line",
            "@id": "$id",
            "@idSource": "platform",
            "@lastSource": "keep",
            Line_isNotMatched: {
              $not: "$x.hasMatched",
            },
          },
        })
        .build(),
    },
    {
      input: col.dm_LineSpan,
      src: __filename,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      comment:
        "Связь фиктивных пролетов с фиктивными сегментами тип 2 (КА+отпайка)",
      pipeline: new Pipeline()
        .comment1(
          "Поиск фиктивного сегмента который соответствует фиктивному пролету"
        )
        .comment2("Берем фиктивный пролет")
        .match({ "model.LineSpan_fakeType": 2 })
        .comment2("Находим следующий и предыдущий пролеты")
        .lookup({
          from: col.dm_LineSpan,
          localField: "model.LineSpan_StartTower",
          foreignField: "model.LineSpan_EndTower",
          as: "pls",
        })
        .unwind("$pls")
        .lookup({
          from: col.dm_LineSpan,
          localField: "model.LineSpan_EndTower",
          foreignField: "model.LineSpan_StartTower",
          as: "nls",
        })
        .unwind("$nls")
        .comment2(
          "Берем следующий и предыдущий acls через пролеты. Потом ищем все связанные acls для них (в т.ч. через КА). acls связанный одновременно со следующим и предыдущим и есть тот, который мы ищем"
        )
        .addStepsFromPipeline(
          lookupRelatedSegmentsId("pls.model.LineSpan_ACLineSegment", "nAcls")
        )
        .addStepsFromPipeline(
          lookupRelatedSegmentsId("nls.model.LineSpan_ACLineSegment", "pAcls")
        )
        .project({
          lsId: "$id",
          aclsId: { $setIntersection: ["$nAcls", "$pAcls"] },
        })
        .unwind("$aclsId")
        .project({
          model: {
            "@type": "LineSpan",
            "@id": "$lsId",
            "@idSource": "platform",
            "@lastSource": "keep",
            LineSpan_ACLineSegment: {
              "@idSource": "platform",
              "@type": "ACLineSegment",
              "@id": "$aclsId",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
  ],
};

function lookupRelatedEquipmentId(
  from: string,
  as: string,
  filter: Expression
) {
  let fields: any = {};
  fields[as] = "$item.id";
  return new Pipeline()
    .entityId(from)
    .inverseLookupChildrenOfType("Terminal", "Terminal_ConductingEquipment")
    .unwindEntity()
    .lookupParent("Terminal_ConnectivityNode")
    .unwindEntity()
    .inverseLookupChildrenOfType("Terminal", "Terminal_ConnectivityNode")
    .unwindEntity()
    .lookupParent("Terminal_ConductingEquipment", "item")
    .unwindEntity()
    .matchExpr({ $ne: ["$" + from, "$item.id"] })
    .matchExpr(filter)
    .addFields(fields)
    .unset("item");
}

function lookupRelatedSegmentsId(from: string, as: string) {
  let fields: any = {};
  fields[as] = "$acls";
  return new Pipeline()
    .entityId(from)
    .comment("Собираем сегменты соединенные напрямую")
    .entityAggregate(
      "dAcls",
      new Pipeline()
        .project({ id: "$id" })
        .addStepsFromPipeline(
          lookupRelatedEquipmentId("id", "aclsId", {
            $eq: ["$item.type", "ACLineSegment"],
          })
        )
        .matchExpr({ $ne: ["$id", "$aclsId"] })
    )
    .comment("Собираем сегменты соединенные через КА")
    .entityAggregate(
      "swAcls",
      new Pipeline()
        .project({ id: "$id" })
        .addStepsFromPipeline(
          lookupRelatedEquipmentId("id", "switchId", {
            $ne: ["$item.type", "ACLineSegment"],
          })
        )
        .addStepsFromPipeline(
          lookupRelatedEquipmentId("switchId", "aclsId", {
            $eq: ["$item.type", "ACLineSegment"],
          })
        )
        .matchExpr({ $ne: ["$id", "$aclsId"] })
    )
    .addFields({
      acls: { $concatArrays: ["$dAcls.aclsId", "$swAcls.aclsId"] },
    })
    .addFields(fields)
    .unset(["dAcls", "swAcls", "acls"]);
}

// utils.compileFlow((flow.operation[0] as MultiStepFlow).operation[1]);
