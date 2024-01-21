import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";

export const indexes: CollectionIndexSet[] = [
  {
    collection: thisCol.prep_TerminalGraphFiltered,
    indexes: [["left"]],
  },
];

export const flow: MultiStepFlow = {
  src: __filename,
  comment:
    "Заполнение поля Terminal_index: 1 - входной терминал, 2 - другие терминалы. Заполнение осуществляется в порядке следования от питающего центра",
  operation: [
    {
      comment: `Формируется граф терминалов - коллекция с полями left и right. Эти поля содержат id терминалов непосредственно связанных единиц оборудования,
         при этом если left входной терминал то right тоже и наоборот`,
      input: col.dm_ConnectivityNode,
      output: thisCol.prep_TerminalGraphFull,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .entityId("id")
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConnectivityNode",
          "t"
        )
        .project({
          node: "$id",
          left: "$t.id",
          right: "$t.id",
        })
        .unwind("$left")
        .entityId("left")
        .lookupParent("Terminal_ConductingEquipment")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConductingEquipment",
          "prev"
        )
        .unwindEntity()
        .matchExpr({ $ne: ["$left", "$prev.id"] })
        .unwind("$right")
        .matchExpr({ $ne: ["$left", "$right"] })
        .project({
          left: "$prev.id",
          right: "$right",
        })
        .build(),
    },
    {
      comment: `Убираем связи между оборудованием находящимся на разных линиях`,
      input: thisCol.prep_TerminalGraphFull,
      output: thisCol.prep_TerminalGraphFiltered,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .entityId("left")
        .lookupParent("Terminal_ConductingEquipment")
        .unwindEntity()
        .lookupParent("IdentifiedObject_RootContainer", "lc")
        .unwindEntity(true)
        .entityId("right")
        .lookupParent("Terminal_ConductingEquipment")
        .unwindEntity()
        .lookupParent("IdentifiedObject_RootContainer", "rc")
        .unwindEntity(true)
        .matchExpr({
          $or: [
            // { $ne: ["$lc.type", "Line"] },
            // { $ne: ["$rc.type", "Line"] },
            { $eq: ["$rc.id", "$lc.id"] },
          ],
        })
        .unset(["lc", "rc"])
        .build(),
    },
    {
      comment:
        "Поиск первого терминала ACLS который подключен к питающему центру",
      input: col.dm_Substation,
      output: thisCol.prep_SuppliedTerminal,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ "model.Substation_isSupplyCenter": true })
        .entityId("id")
        .lookupChildren("EquipmentContainer_ContainedEquipment")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConductingEquipment",
          "inT"
        )
        .unwindEntity()
        .lookupParentOfType("ConnectivityNode", "Terminal_ConnectivityNode")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConnectivityNode",
          "outT"
        )
        .unwindEntity()
        .lookupParentOfType(
          "ACLineSegment",
          "Terminal_ConductingEquipment",
          "acls"
        )
        .unwindEntity()
        .group({
          _id: "$outT.id",
          fromTerminal: { $push: "$inT.id" },
        })
        .build(),
    },
    {
      input: thisCol.prep_SuppliedTerminal,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .comment(
          "Проход по графу терминалов начиная с первого входного терминала. Таким образом собираются все входные терминалы"
        )
        // .match({ _id: "c6a7cde0-c699-46f3-af88-a4e7623c4727" })
        .graphLookup({
          from: thisCol.prep_TerminalGraphFiltered,
          startWith: "$_id",
          connectFromField: "right",
          connectToField: "left",
          as: "t",
        })
        // //////
        // .unwind("$t")
        // //////
        .project({
          l: "$t.left",
          r: "$t.right",
        })
        .project({
          t: { $concatArrays: ["$l", "$r"] },
        })
        .unwind("$t")
        .group({ _id: "$t" })
        // ////////
        // .entityId("l")
        // .lookupParent("Terminal_ConductingEquipment")
        // .unwindEntity()
        // .lookupParent("Equipment_EquipmentContainer", "lc")
        // .unwindEntity()
        // .entityId("r")
        // .lookupParent("Terminal_ConductingEquipment")
        // .unwindEntity()
        // .lookupParent("Equipment_EquipmentContainer", "rc")
        // .unwindEntity()
        // .project({
        //   l: "$l",
        //   lc: "$lc",
        //   r: "$r",
        //   rc: "$rc",
        // })
        // // .group({ _id: "$id", container:"$ec.model.IdentifiedObject_name"})
        // // .group({ _id: "$ec.model.IdentifiedObject_name" })
        // /////////////
        .comment("Установка index=1 у входных терминалов")
        .project({
          model: {
            "@id": "$_id",
            "@idSource": "platform",
            "@action": "update",
            "@type": "Terminal",
            "@lastSource": "keep",
            Terminal_index: { $literal: 1 },
          },
        })
        .build(),
    },
    {
      comment:
        "Установка index=2 на выходном терминале оборудования питающей подстанции",
      input: thisCol.prep_SuppliedTerminal,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      // output: "test",
      // operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .unwind("$fromTerminal")
        .group({ _id: "$fromTerminal" })
        .project({
          model: {
            "@id": "$_id",
            "@idSource": "platform",
            "@action": "update",
            "@type": "Terminal",
            "@lastSource": "keep",
            Terminal_index: { $literal: 2 },
          },
        })
        .build(),
    },
    {
      comment:
        "Установка index=2 для других терминалов оборудования, у которого определен терминал с index=1",
      input: col.dm_Terminal,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      // output: "test",
      // operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ "model.Terminal_index": 1 })
        .entityId("id")
        .lookupParent("Terminal_ConductingEquipment")
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "Terminal",
          "Terminal_ConductingEquipment",
          "t2"
        )
        .unwindEntity()
        .matchExpr({ $ne: ["$id", "$t2.id"] })
        .project({
          model: {
            "@id": "$t2.id",
            "@idSource": "platform",
            "@action": "update",
            "@type": "Terminal",
            "@lastSource": "keep",
            Terminal_index: { $literal: 2 },
          },
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[3]);
