import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as col from "collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import * as sysCol from "_sys/collections";
import { Pipeline } from "_sys/classes/Pipeline";
export const flows: Flow[] = [
  {
    src: __filename,
    input: thisCol.flow_affected_ACLineSegment,
    output: thisCol.flow_ACLineSegment_old,
    operationType: OperationType.replace,
    pipeline: [
      // Пока обрабатываем сразу всю линию но предполагается что лучше ограничить участком на котором есть изменения.
      // Пока нет ясности, как его определить, без нарушения дальнейшего алгоритма.
      // {
      //   $group: {
      //     _id: "$lineId",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: col.dm_ACLineSegment,
      //     localField: "_id",
      //     foreignField: "model.Equipment_EquipmentContainer",
      //     as: "acls",
      //   },
      // },
      {
        $lookup: {
          from: col.dm_ACLineSegment,
          localField: "_id",
          foreignField: "id",
          as: "acls",
        },
      },
      {
        $unwind: "$acls",
      },
      {
        $project: {
          _id: "$acls.extId.processor",
          platformId: "$acls.id",
          isSwitch: { $literal: false },
          firstLsId: "$acls.model.ACLineSegment_FirstLineSpan",
          lastLsId: "$acls.model.ACLineSegment_LastLineSpan",
          baseVoltage: "$acls.model.ConductingEquipment_BaseVoltage",
          name: "$acls.model.IdentifiedObject_name",
          length: "$acls.model.Conductor_length"
        },
      },
    ],
  },
  {
    src: __filename,
    input: thisCol.flow_ACLineSegment_old,
    output: thisCol.flow_ACLineSegment_old,
    operationType: OperationType.insert,
    pipeline: new Pipeline()
      .entityId("platformId")
      .lookupChildren("ConductingEquipment_Terminals", "terminal")
      .unwindEntity()
      .lookupParent("Terminal_ConnectivityNode")
      .unwindEntity()
      .lookupChildren("ConnectivityNode_Terminals", "otherTerminal")
      .unwindEntity()
      .matchExpr({ $ne: ["$terminal.id", "$otherTerminal.id"] })
      .lookupParent("Terminal_ConductingEquipment", "equipment")
      .lookupParent("Equipment_EquipmentContainer", "container")
      .match({ "container.type": "Line" })
      .group({
        _id: "$equipment.id",
        first: { $first: "$$ROOT" },
      })
      .project({
        _id: "$first.equipment.extId.processor",
        platformId: "$first.equipment.id",
        isSwitch: { $literal: true },
      })
      .build(),
  },
];

// compileFlow(flows[1] as SingleStepFlow);
