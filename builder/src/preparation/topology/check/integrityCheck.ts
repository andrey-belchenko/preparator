import { MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as thisCol from "../_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as trig from "triggers";
export const flow: MultiStepFlow = {
  src: __filename,
  trigger: trig.trigger_TopologyIntegrityCheck,
  operation: [
    {
      input: thisCol.KISUR_LineSpan,
      output: thisCol.integrityCheck,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .entityExtId("КодУчастка", "КИСУР", "AccountPartLine")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LineSpan",
          line: "$КодЛинии",
          code: "$КодПролета",
          value: "$КодУчастка",
          issue: "Ссылка на несуществующий участок",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_Tower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .entityExtId("КодУчастка", "КИСУР", "AccountPartLine")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "Tower",
          line: "$КодЛинии",
          code: "$КодОпоры",
          value: "$КодУчастка",
          issue: "Ссылка на несуществующий участок",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_LineSwitchTower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .entityExtId("КодСледующегоПролета", "КИСУР", "LineSpan")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LineSwitchTower",
          line: "$КодЛинии",
          code: "$КодКА",
          value: "$КодСледующегоПролета",
          issue: "Ссылка на несуществующий пролет",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_LinkSpanTower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .matchExpr("$КодОпоры")
        .matchExpr({ $ne: ["$КодОпоры", ""] })
        .entityExtId("КодОпоры", "КИСУР", "Tower")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LinkSpanTower",
          line: "$КодЛинии",
          value: "$КодОпоры",
          issue: "Ссылка на несуществующую опору",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_LinkSpanTower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .matchExpr("$КодПролетаОт")
        .matchExpr({ $ne: ["$КодПролетаОт", ""] })
        .entityExtId("КодПролетаОт", "КИСУР", "LineSpan")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LinkSpanTower",
          line: "$КодЛинии",
          value: "$КодПролетаОт",
          issue: "Ссылка на несуществующий пролет",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_LinkSpanTower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .matchExpr("$КодПролетаК")
        .matchExpr({ $ne: ["$КодПролетаК", ""] })
        .entityExtId("КодПролетаК", "КИСУР", "LineSpan")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LinkSpanTower",
          line: "$КодЛинии",
          value: "$КодПролетаК",
          issue: "Ссылка на несуществующий пролет",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_SubstationLinkSpanTower,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .matchExpr("$Пролет")
        .matchExpr({ $ne: ["$Пролет", ""] })
        .entityExtId("Пролет", "КИСУР", "LineSpan")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "SubstationLinkSpanTower",
          code: "$ОборудованиеПодстанции",
          line: "$КодЛинии",
          value: "$Пролет",
          issue: "Ссылка на несуществующий пролет",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_SK11_LineSpanACLS,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .matchExpr("$Пролет")
        .matchExpr({ $ne: ["$Пролет", ""] })
        .entityExtId("Пролет", "КИСУР", "LineSpan")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LineSpanACLS",
          line: "$КодЛинии",
          value: "$Пролет",
          issue: "Ссылка на несуществующий пролет",
          item: "$item",
        })
        .build(),
    },
    {
      input: thisCol.KISUR_SK11_LineSpanACLS,
      output: thisCol.integrityCheck,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .addFields({
          item: "$$ROOT",
        })
        .unset(["item._id", "item.changedAt"])
        .entityId("uidACLS", "ACLineSegment")
        .lookupSelf("p")
        .unwindEntity(true)
        .matchExpr({ $not: "$p.model.IdentifiedObject_ParentObject" })
        .project({
          dataSet: "LineSpanACLS",
          line: "$КодЛинии",
          value: "$uidACLS",
          issue: "Ссылка на несуществующий сегмент",
          item: "$item",
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[8]);
