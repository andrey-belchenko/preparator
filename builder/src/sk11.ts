import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import * as difOutput from "_sys/flows/diffOutput";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";

var classes = [
  "ACLineSegment",
  "Bay",
  "Breaker",
  "BusbarSection",
  "CurrentTransformer",
  "Disconnector",
  "Recloser",
  "Fuse",
  "GroundDisconnector",
  "Line",
  "NonConformLoad",
  "PotentialTransformer",
  "PowerTransformer",
  "PowerTransformerEnd",
  "Substation",
  "SurgeArrester",
  "Terminal",
  "VoltageLevel",
  "ConnectivityNode",
  "Folder",
  "GenericView",
  "NoLoadTestME",
  "ShortCircuitTestME",
  "TransformerMeshImpedance",
  "RatioTapChanger",
  "Junction",
  "Meter",
  // "MeterMultiplier", // долетает в СК-11, при необходимости можем передавать
  "UsagePoint",
  "ServiceLocation",
  "Customer",
];

var properties = [
  "ACLineSegment.IdentifiedObject_ParentObject",
  "ACLineSegment.Equipment_EquipmentContainer",
  "ACLineSegment.IdentifiedObject_name",
  "ACLineSegment.PowerSystemResource_ccsCode",
  "ACLineSegment.ConductingEquipment_BaseVoltage",
  "ACLineSegment.PowerSystemResource_Diagrams",
  "ACLineSegment.Conductor_length",
  "ACLineSegment.IdentifiedObject_OrganisationRoles",
  "ACLineSegment.PowerSystemResource_PSRType",
  "ACLineSegment.ConductingEquipment_ControlArea",
  "Breaker.IdentifiedObject_ParentObject",
  "Breaker.Equipment_EquipmentContainer",
  "Breaker.Equipment_nameplate",
  "Breaker.IdentifiedObject_name",
  "Breaker.Equipment_normallyInService",
  "Breaker.PowerSystemResource_ccsCode",
  "Breaker.PowerSystemResource_PSRType",
  "Breaker.ConductingEquipment_BaseVoltage",
  "Breaker.IdentifiedObject_description",
  "Breaker.IdentifiedObject_OrganisationRoles",
  "Breaker.PowerSystemResource_Diagrams",
  "Breaker.Switch_ratedCurrent",
  "Breaker.ProtectedSwitch_breakingCapacity",
  "Breaker.ProtectedSwitch_breakingTime",
  "Breaker.ConductingEquipment_ControlArea",
  "BusbarSection.IdentifiedObject_ParentObject",
  "BusbarSection.Equipment_EquipmentContainer",
  "BusbarSection.IdentifiedObject_name",
  "BusbarSection.IdentifiedObject_OrganisationRoles",
  "BusbarSection.IdentifiedObject_description",
  "BusbarSection.Equipment_normallyInService",
  "BusbarSection.ConductingEquipment_BaseVoltage",
  "BusbarSection.PowerSystemResource_ccsCode",
  "BusbarSection.PowerSystemResource_Diagrams",
  "BusbarSection.ConductingEquipment_ControlArea",
  "Disconnector.IdentifiedObject_ParentObject",
  "Disconnector.IdentifiedObject_name",
  "Disconnector.IdentifiedObject_description",
  "Disconnector.IdentifiedObject_OrganisationRoles",
  "Disconnector.Equipment_EquipmentContainer",
  "Disconnector.Equipment_normallyInService",
  "Disconnector.PowerSystemResource_ccsCode",
  "Disconnector.ConductingEquipment_BaseVoltage",
  "Disconnector.PowerSystemResource_Diagrams",
  "Disconnector.PowerSystemResource_PSRType",
  "Disconnector.Switch_ratedCurrent",
  "Disconnector.ConductingEquipment_ControlArea",
  "Recloser.IdentifiedObject_ParentObject",
  "Recloser.Equipment_EquipmentContainer",
  "Recloser.IdentifiedObject_name",
  "Recloser.Equipment_normallyInService",
  "Recloser.PowerSystemResource_ccsCode",
  "Recloser.ConductingEquipment_BaseVoltage",
  "Recloser.PowerSystemResource_Diagrams",
  "Substation.IdentifiedObject_name",
  "Substation.IdentifiedObject_description",
  "Substation.IdentifiedObject_OrganisationRoles",
  "Substation.Substation_isSupplyCenter",
  "Substation.PowerSystemResource_ccsCode",
  "Substation.Substation_Region",
  "Substation.IdentifiedObject_ParentObject",
  "Substation.PowerSystemResource_Diagrams",
  "VoltageLevel.IdentifiedObject_name",
  "VoltageLevel.IdentifiedObject_ParentObject",
  "VoltageLevel.IdentifiedObject_description",
  "VoltageLevel.VoltageLevel_Substation",
  "VoltageLevel.VoltageLevel_BaseVoltage",
  "VoltageLevel.PowerSystemResource_ccsCode",
  "VoltageLevel.PowerSystemResource_Diagrams",
  "PowerTransformer.IdentifiedObject_name",
  "PowerTransformer.IdentifiedObject_description",
  "PowerTransformer.PowerTransformer_isStationSupply",
  "PowerTransformer.Equipment_normallyInService",
  "PowerTransformer.Equipment_nameplate",
  "PowerTransformer.Equipment_EquipmentContainer",
  "PowerTransformer.IdentifiedObject_ParentObject",
  "PowerTransformer.PowerTransformer_PowerTransformerEnd",
  "PowerTransformer.PowerSystemResource_ccsCode",
  "PowerTransformer.PowerSystemResource_Diagrams",
  "PowerTransformer.PowerSystemResource_PSRType",
  "PowerTransformerEnd.TransformerEnd_BaseVoltage",
  "PowerTransformerEnd.TransformerEnd_Terminal",
  "PowerTransformerEnd.TransformerEnd_endNumber",
  "PowerTransformerEnd.TransformerEnd_ToMeshImpedance",
  "PowerTransformerEnd.TransformerEnd_rground",
  "PowerTransformerEnd.TransformerEnd_xground",
  "PowerTransformerEnd.IdentifiedObject_name",
  "PowerTransformerEnd.IdentifiedObject_description",
  "PowerTransformerEnd.PowerTransformerEnd_ratedS",
  "PowerTransformerEnd.PowerTransformerEnd_ratedU",
  "PowerTransformerEnd.PowerTransformerEnd_connectionKind",
  "PowerTransformerEnd.PowerTransformerEnd_phaseAngleClock",
  "PowerTransformerEnd.PowerTransformerEnd_PowerTransformer",
  "PowerTransformerEnd.IdentifiedObject_ParentObject",
  "PowerTransformerEnd.PowerSystemResource_Diagrams",
  "Bay.IdentifiedObject_name",
  "Bay.IdentifiedObject_description",
  "Bay.IdentifiedObject_ParentObject",
  "Bay.IdentifiedObject_OrganisationRoles",
  "Bay.Equipment_EquipmentContainer",
  "Bay.PowerSystemResource_ccsCode",
  "Bay.PowerSystemResource_Diagrams",
  "Terminal.Terminal_ConductingEquipment",
  "Terminal.IdentifiedObject_ParentObject",
  "Terminal.ACDCTerminal_sequenceNumber",
  "Terminal.Terminal_ConductingEquipment",
  "Terminal.Terminal_ConnectivityNode",
  "SurgeArrester.IdentifiedObject_name",
  "SurgeArrester.IdentifiedObject_description",
  "SurgeArrester.IdentifiedObject_ParentObject",
  "SurgeArrester.IdentifiedObject_OrganisationRoles",
  "SurgeArrester.PowerSystemResource_ccsCode",
  "SurgeArrester.PowerSystemResource_Diagrams",
  "CurrentTransformer.IdentifiedObject_name",
  "CurrentTransformer.IdentifiedObject_description",
  "CurrentTransformer.IdentifiedObject_ParentObject",
  "CurrentTransformer.AuxiliaryEquipment_Terminal",
  "CurrentTransformer.PowerSystemResource_ccsCode",
  "CurrentTransformer.PowerSystemResource_Diagrams",
  "NonConformLoad.IdentifiedObject_name",
  "NonConformLoad.IdentifiedObject_ParentObject",
  "NonConformLoad.IdentifiedObject_description",
  "NonConformLoad.Equipment_normallyInService",
  "NonConformLoad.Equipment_EquipmentContainer",
  "NonConformLoad.ConductingEquipment_BaseVoltage",
  "NonConformLoad.PowerSystemResource_ccsCode",
  "NonConformLoad.PowerSystemResource_Diagrams",
  "GroundDisconnector.IdentifiedObject_name",
  "GroundDisconnector.IdentifiedObject_description",
  "GroundDisconnector.IdentifiedObject_OrganisationRoles",
  "GroundDisconnector.Equipment_normallyInService",
  "GroundDisconnector.Equipment_normalOpen",
  "GroundDisconnector.Equipment_EquipmentContainer",
  "GroundDisconnector.IdentifiedObject_ParentObject",
  "GroundDisconnector.ConductingEquipment_BaseVoltage",
  "GroundDisconnector.PowerSystemResource_ccsCode",
  "GroundDisconnector.PowerSystemResource_Diagrams",
  "Fuse.IdentifiedObject_name",
  "Fuse.IdentifiedObject_description",
  "Fuse.Equipment_EquipmentContainer",
  "Fuse.IdentifiedObject_ParentObject",
  "Fuse.IdentifiedObject_OrganisationRoles",
  "Fuse.ConductingEquipment_BaseVoltage",
  "Fuse.Equipment_normallyInService",
  "Fuse.PowerSystemResource_ccsCode",
  "Fuse.Switch_ratedCurrent",
  "Fuse.PowerSystemResource_Diagrams",
  "Fuse.Fuse_breakingCapacity",
  "Fuse.ConductingEquipment_ControlArea",
  "PotentialTransformer.IdentifiedObject_name",
  "PotentialTransformer.IdentifiedObject_description",
  "PotentialTransformer.IdentifiedObject_ParentObject",
  "PotentialTransformer.PowerSystemResource_ccsCode",
  "PotentialTransformer.PowerSystemResource_Diagrams",
  "Line.IdentifiedObject_name",
  "Line.IdentifiedObject_description",
  "Line.Line_Region",
  "Line.PowerSystemResource_ccsCode",
  "Line.IdentifiedObject_ParentObject",
  "Line.PowerSystemResource_Diagrams",
  "ConnectivityNode.ConnectivityNode_ConnectivityNodeContainer",
  "ConnectivityNode.IdentifiedObject_ParentObject",
  "Folder.IdentifiedObject_name",
  "Folder.IdentifiedObject_ParentObject",
  "GenericView.IdentifiedObject_name",
  "GenericView.IdentifiedObject_ParentObject",
  "NoLoadTestME.IdentifiedObject_name",
  "NoLoadTestME.NoLoadTestME_excitingCurrent",
  "NoLoadTestME.NoLoadTestME_loss",
  "NoLoadTestME.NoLoadTestME_EnergisedEnd",
  "NoLoadTestME.IdentifiedObject_ParentObject",
  "ShortCircuitTestME.IdentifiedObject_name",
  "ShortCircuitTestME.IdentifiedObject_ParentObject",
  "ShortCircuitTestME.ShortCircuitTestME_shortCircuitVoltage",
  "ShortCircuitTestME.ShortCircuitTestME_loss",
  "ShortCircuitTestME.ShortCircuitTestME_EnergisedEnd",
  "ShortCircuitTestME.ShortCircuitTestME_GroundedEnds",
  "TransformerMeshImpedance.IdentifiedObject_name",
  "TransformerMeshImpedance.IdentifiedObject_ParentObject",
  "TransformerMeshImpedance.TransformerMeshImpedance_r",
  "TransformerMeshImpedance.TransformerMeshImpedance_x",
  "TransformerMeshImpedance.TransformerMeshImpedance_FromTransformerEnd",
  "TransformerMeshImpedance.TransformerMeshImpedance_ToTransformerEnd",
  "RatioTapChanger.IdentifiedObject_name",
  "RatioTapChanger.IdentifiedObject_ParentObject",
  "RatioTapChanger.RatioTapChanger_TransformerEnd",
  "Meter.IdentifiedObject_name",
  "Meter.IdentifiedObject_ParentObject",
  "Meter.IdentifiedObject_mRID",
  "Meter.Asset_SerialNumber",
  "Meter.MeterMultipliers_MeterMultiplier",
  "Meter.EndDevice_UsagePoint",
  "Meter.Meter_MeteringPointCode",
  "MeterMultiplier.IdentifiedObject_name",
  "MeterMultiplier.MeterMultiplier_value",
  "MeterMultiplier.IdentifiedObject_ParentObject",
  "MeterMultiplier.MeterMultiplier_kind",
  "UsagePoint.IdentifiedObject_name",
  "UsagePoint.IdentifiedObject_ParentObject",
  "UsagePoint.IdentifiedObject_mRID",
  "UsagePoint.UsagePoint_ServiceLocation",
  "UsagePoint.UsagePoint_Customer",
  "UsagePoint.UsagePoint_Terminal",
  "ServiceLocation.IdentifiedObject_name",
  "ServiceLocation.IdentifiedObject_description",
  "ServiceLocation.IdentifiedObject_ParentObject",
  "Customer.IdentifiedObject_name",

  // Не работает, скорее всего эти объекты не являются наследниками PowerSystemResource, нет такого поля
  // "Meter.PowerSystemResource_Diagrams",
  // "UsagePoint.PowerSystemResource_Diagrams",
  // "ServiceLocation.PowerSystemResource_Diagrams",
];

const entitiesFilter = [
  {
    $match: {
      type: {
        $in: classes,
      },
    },
  },
  {
    $match: {
      $expr: {
        $ne: ["$lastSource", "sk11"],
      },
    },
  },
  {
    $match: {
      $expr: { $not: "$model.BusbarSection_isFake" },
    },
  },
  {
    $match: {
      // папка "Пользователи СК-11"
      // todo вынести в константы, идентификатор присутствует также в скрипте инициализации БД
      $expr: { $ne: ["$id", "745c9faf-5d9f-44fd-8439-197e248febd2"] },
    },
  },
];
const propertiesFilter = [
  {
    $match: {
      fullName: {
        $in: properties,
      },
    },
  },
  {
    $match: {
      $expr: {
        $ne: ["$lastSource", "sk11"],
      },
    },
  },
  {
    $match: {
      $expr: { $not: "$entity.model.BusbarSection_isFake" },
    },
  },
];

const bufferFlows = difOutput.rules(
  col.out_Sk11_buffer,
  false,
  true,
  entitiesFilter,
  propertiesFilter
);

// Создание навигационной структуры MC-257
// todo: получилось что PowerSystemResource_Diagrams проставляется не только у наследников PowerSystemResource но и у других объектов например Terminal. Внести исправления втч на уровне движка, чтобы была проверка (Возможность накладывать фильтр по принадлежности к базовому классу?)
// todo: скорее всего нужна оптимизация
var navigationFlow: SingleStepFlow = {
  src: __filename,
  input: col.out_Sk11_buffer,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  pipeline: new Pipeline()
    .matchExpr({ $ne: ["$predicate", "PowerSystemResource_Diagrams"] })
    .matchExpr({ $in: ["$itemType", ["entity", "field"]] })
    // .match({ _id: "650bfaee-9ace-4dc7-97ed-0f71d343795d" })
    // формируем для удаленных, только если объект был в актуальной версии СК-11, такие объекты д. быть удалены вручную в СК-11
    // если не был, объект удаляется автоматически в СК-11 и в нав. структуру не попадает.
    .matchExpr({ $or: [{ $not: "$item.deletedAt" }, "$attr.skLoadedAt"] })
    .group({ _id: "$id" })
    .entityId("_id")
    .lookupSelfWithDeleted("o")
    .unwindEntity()
    .entityId("_id")
    // объект верхнего уровня линия или подстанция
    .lookupParentWithDeleted("IdentifiedObject_RootContainer", "r")
    .unwindEntity()
    // папка нижнего уровня
    .lookupParentWithDeleted("IdentifiedObject_ParentObject", "p1")
    .unwindEntity()
    // все вышестоящие папки включая p1, самая верхняя папка ссылается на регион
    .graphLookup({
      from: col.dm_Folder,
      startWith: "$p1.initialId",
      connectFromField: "model.IdentifiedObject_ParentObject",
      connectToField: "initialId",
      as: "pf",
    })
    // формирование модели по папкам
    .addFields({
      pfm: {
        $map: {
          input: "$pf",
          as: "it",
          in: {
            "@type": "Folder",
            "@idSource": "processor",
            "@action": "create",
            "@id": { $concat: ["FolderLink", "$$it.id"] },
            IdentifiedObject_name: "$$it.model.IdentifiedObject_name",
            IdentifiedObject_isLink: { $literal: true },
            IdentifiedObject_ParentObject: {
              $cond: [
                // при нормальной ситуации папок без родителя быть не должно, но сталкивался с такой ситуацией при импорте диффа в процессе отладки,
                "$$it.model.IdentifiedObject_ParentObject",
                {
                  "@type": "Folder",
                  "@idSource": "processor",
                  "@action": "link",
                  "@id": {
                    $concat: [
                      "FolderLink",
                      "$$it.model.IdentifiedObject_ParentObject",
                    ],
                  },
                },
                "$$REMOVE",
              ],
            },
            // IdentifiedObject_ParentObject: {
            //   "@type": "Folder",
            //   "@idSource": "processor",
            //   "@action": "link",
            //   "@id": {
            //     $concat: [
            //       "FolderLink",
            //       "$$it.model.IdentifiedObject_ParentObject",
            //     ],
            //   },
            // },
          },
        },
      },
    })
    // поиск региона, ищем и для подстанции и для линии, берем что нашлось.
    .entityId("r.id")
    .lookupParent("Substation_Region", "sr")
    .unwindEntity(true)
    .entityId("r.id")
    .lookupParent("Line_Region", "lr")
    .unwindEntity(true)
    .addFields({
      p2: { $ifNull: ["$sr", "$lr"] },
    })
    // группировка по объекту верхнего уровня, линия или подстанция, нижестоящие объекты собираются в массив
    .group({
      _id: "$r.id",
      r: {
        $first: "$r",
      },
      p1: {
        $first: "$p1",
      },
      p2: {
        $first: "$p2",
      },
      pfm: {
        $first: "$pfm",
      },
      items: { $push: "$_id" },
    })
    .project({
      model: {
        $concatArrays: [
          // создание папок
          "$pfm",
          [
            // создание ссылочного объекта для линию или подстанцию со ссылками на все нижестоящие объекты
            {
              "@type": "GenericView",
              "@action": "create",
              "@id": { $concat: ["GenericView", "$r.id"] },
              "@idSource": "processor",
              IdentifiedObject_name: "$r.model.IdentifiedObject_name",
              MonitelDiagram_PSRs: {
                $map: {
                  input: "$items",
                  as: "it",
                  in: {
                    "@idSource": "platform",
                    "@id": "$$it",
                  },
                },
              },
              IdentifiedObject_isLink: { $literal: true },
              // ссылка на папку нижнего уровня
              IdentifiedObject_ParentObject: {
                "@type": "Folder",
                "@idSource": "processor",
                "@action": "link",
                "@id": { $concat: ["FolderLink", "$p1.id"] },
              },
            },
            // создание папки региона
            {
              "@type": "Folder",
              "@idSource": "processor",
              "@action": "create",
              "@id": { $concat: ["FolderLink", "$p2.id"] },
              IdentifiedObject_name: "$p2.model.IdentifiedObject_name",
              IdentifiedObject_isLink: { $literal: true },
              IdentifiedObject_ParentObject: {
                "@type": "Folder",
                "@idSource": "processor",
                "@action": "create",
                "@id": "FolderLinkRoot",
                IdentifiedObject_name: " Изменения из SAP",
                IdentifiedObject_isLink: { $literal: true },
              },
            },
          ],
        ],
      },
    })
    .build(),
};

export const flows: Flow[] = [
  ...bufferFlows,
  {
    src: __filename,
    input: col.out_Sk11_buffer,
    output: col.out_Sk11,
    operationType: OperationType.sync,
    pipeline: [],
  },
  navigationFlow,
];

// utils.compileFlow(navigationFlow);
