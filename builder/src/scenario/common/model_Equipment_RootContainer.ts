import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import { rootCodeSteps } from "./_utils";

const rootContainers = ["Line", "Substation"];
const mainEquipment = [
  "ACLineSegment",
  "Bay",
  "Breaker",
  "BusbarSection",
  "CurrentTransformer",
  "Disconnector",
  "Recloser",
  "Fuse",
  "GroundDisconnector",
  "NonConformLoad",
  "PotentialTransformer",
  "PowerTransformer",
  "SurgeArrester",
  "VoltageLevel",
  "Junction",
  "FuseSwitchDisconnector",
  "LoadBreakSwitch",
  "Jumper",
  "KnifeSwitch",
  "ConformLoad",
  "PetersenCoil",
  "LinearShuntCompensator",
  "RatioTapChanger",
];
const allObjectTypes = [
  // todo подобный список классов используется и в других местах, найти, обеспечить единообразие и актуальность
  "Line",
  "Substation",
  "ACLineSegment",
  "Bay",
  "Breaker",
  "BusbarSection",
  "CurrentTransformer",
  "Disconnector",
  "Recloser",
  "Fuse",
  "GroundDisconnector",
  "NonConformLoad",
  "PotentialTransformer",
  "PowerTransformer",
  "PowerTransformerEnd",
  "SurgeArrester",
  "Terminal",
  "VoltageLevel",
  "ConnectivityNode",
  "NoLoadTestME",
  "ShortCircuitTestME",
  "TransformerMeshImpedance",
  "Junction",
  "FuseSwitchDisconnector",
  "LoadBreakSwitch",
  "Jumper",
  "KnifeSwitch",
  "ConformLoad",
  "PetersenCoil",
  "LinearShuntCompensator",
  "RatioTapChanger",
  "Meter",
  "UsagePoint",
  "ServiceLocation",
];

const filterNoRc = new Pipeline()
  .entityId("id")
  .lookupParent("IdentifiedObject_RootContainer", "rc")
  .unwindEntity(true)
  .matchExpr({ $not: "$rc" });

// Определение корневого контейнера для каждого объекта
// Первоначальный алгоритм:
// Проходит вверх по дереву до объекта с типом Substation или Line.
// Алгоритм ненадежный при обработке сообщений, т.к. если долетела не вся структура вышестоящего дерева корневой контейнер не определяется.
// Поэтому предусмотрены некоторые дополнительные манипуляции при обработке сообщений.

// Это Первоначальный (далее базовый) алгоритм
const treeLookupPipeline = new Pipeline()
  .matchExpr({
    $in: ["$type", allObjectTypes],
  })
  .addStepsFromPipeline(filterNoRc)
  .entityId("id")
  .lookupAncestorOrSelfOfType(["Line", "Substation"], "root")
  .unwindEntity()
  .project({
    model: {
      "@id": "$id",
      "@idSource": "platform",
      "@action": "link",
      "@lastSource": "keep",
      IdentifiedObject_RootContainer: {
        "@id": "$root.id",
        "@idSource": "platform",
        "@action": "link",
        "@lastSource": "keep",
      },
    },
  })
  .build();

// Для подготовки первоначальных данных достаточно базового алгоритма
export const prepFlow: SingleStepFlow = {
  src: __filename,
  comment:
    "Добавление ссылки на основной контейнер (ПС или ЛЭП) ко всему оборудованию (при загрузке данных)",
  input: col.model_Entities,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  pipeline: treeLookupPipeline,
};

export const onlineFlow: MultiStepFlow = {
  src: __filename,
  comment:
    "Добавление ссылки на основной контейнер (ПС или ЛЭП) ко всему оборудованию (при обработке сообщений)",
  trigger: col.model_Entities,

  operation: [
    {
      // Для Substation и Line корневым контейнером является сам объект
      input: col.model_Entities,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .matchExpr({
          $in: ["$type", rootContainers],
        })
        .addStepsFromPipeline(filterNoRc)
        .project({
          model: {
            "@id": "$id",
            "@idSource": "platform",
            "@action": "link",
            "@lastSource": "keep",
            IdentifiedObject_RootContainer: {
              "@id": "$id",
              "@idSource": "platform",
              "@action": "link",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
      // Определяем корневой контейнер по коду SAP объекта
      input: col.model_Entities,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .matchExpr({
          $in: ["$type", mainEquipment],
        })
        .addStepsFromPipeline(filterNoRc)
        .matchExpr("$extId.КИСУР")
        .addSteps(rootCodeSteps("$extId.КИСУР"))
        .entityExtId("rootCode", "КИСУР")
        .lookupSelf("rc")
        .unwindEntity()
        .match({ "rc.type": "Substation" })
        .project({
          model: {
            "@id": "$id",
            "@idSource": "platform",
            "@action": "link",
            "@lastSource": "keep",
            IdentifiedObject_RootContainer: {
              "@id": "$rc.id",
              "@idSource": "platform",
              "@action": "link",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
      // Определяем корневой контейнер по коду SAP родителя
      input: col.model_Entities,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .matchExpr({
          $in: ["$type", allObjectTypes],
        })
        .addStepsFromPipeline(filterNoRc)
        .entityId("id")
        .lookupParent("IdentifiedObject_ParentObject", "p")
        .unwindEntity()
        .matchExpr("$p.extId.КИСУР")
        .addSteps(rootCodeSteps("$p.extId.КИСУР"))
        .entityExtId("rootCode", "КИСУР")
        .lookupSelf("rc")
        .unwindEntity()
        .match({ "rc.type": "Substation" })
        .project({
          model: {
            "@id": "$id",
            "@idSource": "platform",
            "@action": "link",
            "@lastSource": "keep",
            IdentifiedObject_RootContainer: {
              "@id": "$rc.id",
              "@idSource": "platform",
              "@action": "link",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
      // Берем корневой контейнер из вышестоящего объекта, там где он есть
      input: col.model_Entities,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .matchExpr({
          $in: ["$type", allObjectTypes],
        })
        .addStepsFromPipeline(filterNoRc)
        .entityId("id")
        .lookupParent("IdentifiedObject_ParentObject", "p")
        .unwindEntity()
        .lookupParent("IdentifiedObject_RootContainer", "prc")
        .unwindEntity()
        .project({
          model: {
            "@id": "$id",
            "@idSource": "platform",
            "@action": "link",
            "@lastSource": "keep",
            IdentifiedObject_RootContainer: {
              "@id": "$prc.id",
              "@idSource": "platform",
              "@action": "link",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
        // Базовый алгоритм для оставшихся объектов
      input: col.model_Entities,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: treeLookupPipeline,
    },
  ],
};

// utils.compileFlow(onlineFlow.operation[2]);
