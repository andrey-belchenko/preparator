import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as trig from "triggers";

export const flow: MultiStepFlow = {
  trigger: trig.trigger_BuildLineEquipmentSchema,
  src: __filename,
  comment: "Формирование элементов по линии для отображения на схеме сегментов",
  operation: [
    {
      comment: "Формирование узлов по оборудованию",
      input: col.dm_Line,
      output: thisCol.LineEquipmentSchemaNodes,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()

        // .matchExpr({
        //   $in: [
        //     "$id",
        //     [
        //        //Закольцованные линии:
        //       "08332f70-49bf-4cc7-8c61-a2f45e942972",// вл-10-5
        //       "62172f93-f5c7-4567-b0ec-9d80f9721181",// вл-10-3
        //     ],
        //   ],
        // })
        // .match({ id: "ecd12449-a868-48cf-852e-bcfb47f93168" }) //ВЛ-10-6
        // .match({ id: "4bec9910-ea0f-42b3-9105-b230b61d9d05" }) //ВЛ-10-5
        // .match({ id: "58a49bcf-cc46-49f1-bc51-548ea4e8fcc0" }) // Березовка VS010-0010899 ВЛ-10-2
        .matchExpr("$extId.КИСУР")
        .entityId("id")
        .lookupChildren("EquipmentContainer_Equipments", "e")
        .unwindEntity()
        .project({
          _id: false,
          id: "$e.id",
          text: { $concat: ["$e.model.IdentifiedObject_name", " ", "$e.id"] },
          type: "df.endElement",
          objType: "equipment",
          lineCode: "$extId.КИСУР"
        })
        .build(),
    },
    {
      comment: "Формирование узлов по терминалам",
      input: thisCol.LineEquipmentSchemaNodes,
      output: thisCol.LineEquipmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ objType: "equipment" })
        .entityId("id")
        .lookupChildren("ConductingEquipment_Terminals", "t")
        .unwindEntity()
        .lookupParent("Terminal_ConnectivityNode", "n")
        .unwindEntity(true)
        .project({
          id: "$t.id",
          text: {
            $concat: [
              "T",
              { $toString: "$t.model.ACDCTerminal_sequenceNumber" },
              "(",
              { $ifNull: [{ $toString: "$t.model.Terminal_index" }, ""] },
              ")",
              " ",
              "$t.id",
            ],
          },
          type: "text",
          // terminalNumber: "$t.model.Terminal_index",
          terminalNumber: "$t.model.ACDCTerminal_sequenceNumber",
          objType: "terminal",
          equipment: "$id",
          node: "$n.id",
          lineCode: "$lineCode"
        })
        .build(),
    },
    {
      comment: "Формирование узлов по Connectivity Node",
      input: thisCol.LineEquipmentSchemaNodes,
      output: thisCol.LineEquipmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ objType: "terminal" })
        .entityId("node")
        .lookupSelf("n")
        .unwindEntity()
        .group({
          _id: "$n.id",
          n: { $first: "$n" },
          lineCode: { $first: "$lineCode" },
        })
        .project({
          id: "$n.id",
          text: "$n.id",
          type: "df.node",
          objType: "node",
          lineCode: "$lineCode",
        })
        .build(),
    },
    {
      comment: "Формирование граней 1",
      input: thisCol.LineEquipmentSchemaNodes,
      output: thisCol.LineEquipmentSchemaEdges,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ objType: "terminal" })
        .project({
          fromId: {
            $cond: [{ $eq: ["$terminalNumber", 1] }, "$id", "$equipment"],
          },
          id: { $concat: ["$id", "-1"] },
          text: { $concat: ["$id", "-1"] },
          toId: {
            $cond: [{ $eq: ["$terminalNumber", 1] }, "$equipment", "$id"],
          },
          lineCode: "$lineCode",
        })
        .build(),
    },
    {
      comment: "Формирование граней 2",
      input: thisCol.LineEquipmentSchemaNodes,
      output: thisCol.LineEquipmentSchemaEdges,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ objType: "terminal" })
        .project({
          fromId: {
            $cond: [{ $eq: ["$terminalNumber", 2] }, "$id", "$node"],
          },
          id: { $concat: ["$id", "-2"] },
          text: { $concat: ["$id", "-2"] },
          toId: {
            $cond: [{ $eq: ["$terminalNumber", 2] }, "$node", "$id"],
          },
          lineCode: "$lineCode",
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[1] as SingleStepFlow);
