import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";
import * as inputCol from "../input/_collections";
import * as thisCol from "./_collections";
import { compileFlow } from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

//TODO : тут каша, постараться упростить, оптимизировать
export const flows: Flow[] = [
  // По подстанциям
  {
    src: __filename,
    input: thisCol.flow_Terminal_new,
    output: thisCol.flow_ConnectivityNode_nameExisting,
    operationType: OperationType.replace,
    pipeline: [
      {
        $group: {
          _id: "$nodePlatformId",
        },
      },
      {
        $match: { $expr: "$_id" },
      },
      {
        // TODO: в разных подпалинах есть места где ищется подстанция по дочернему элементу, постараться свести к общему решению
        $graphLookup: {
          from: "model_Links",
          startWith: "$_id",
          connectFromField: "toId",
          connectToField: "fromId",
          as: "parents",
          restrictSearchWithMatch: {
            $expr: { $eq: ["$predicate", "IdentifiedObject_ParentObject"] },
            // $expr: {$eq: ["$predicate", "Equipment_EquipmentContainer"]},
          },
        },
      },
      {
        $unwind: "$parents",
      },
      {
        $match: { "parents.toType": "Substation" },
      },
      {
        $lookup: {
          localField: "parents.toId",
          from: col.dm_Substation,
          foreignField: "id",
          as: "substation",
        },
      },
      {
        $unwind: "$substation",
      },
      {
        $group: {
          // _id: {$concat:["$_id","-1"]} ,
          _id: "$_id",
          name: { $first: "$substation.model.IdentifiedObject_name" },
        },
      },
    ],
  },
  // По существующим узлам ACLS
  {
    src: __filename,
    input: thisCol.flow_Terminal_new,
    output: thisCol.flow_ConnectivityNode_nameExisting,
    operationType: OperationType.sync,
    pipeline: [
      ...prepExistingSteps(),
      {
        $match: { "terminal.model.Terminal_index": 1 },
      },
      {
        $lookup: {
          localField: "equipmentId",
          from: col.dm_ACLineSegment,
          foreignField: "id",
          as: "equipment",
        },
      },
      {
        $unwind: "$equipment",
      },
      ...getNodeNameByTapSteps("equipment.model.ACLineSegment_FirstLineSpan"),
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
        },
      },
    ],
  },
  // // По существующим узлам КА // Не работает захватывает КА на станциях
  // {
  //   src: __filename,
  //   input: thisCol.flow_Terminal_new,
  //   output: thisCol.flow_ConnectivityNode_nameExisting,
  //   operationType: OperationType.sync,
  //   pipeline: [
  //     ...prepExistingSteps(),
  //     {
  //       $lookup: {
  //         localField: "equipmentId",
  //         from: sysCol.model_Entities,
  //         foreignField: "id",
  //         as: "equipment",
  //       },
  //     },
  //     {
  //       $unwind: "$equipment",
  //     },
  //     { $match: { $expr: { $ne: ["$equipment.type", "ACLineSegment"] } } },
  //     {
  //       $group: {
  //         _id: "$_id",
  //         name: { $first: "$equipment.model.IdentifiedObject_name" },
  //       },
  //     },
  //   ],
  // },
  // По новым узлам ACLS
  {
    src: __filename,
    input: thisCol.flow_Terminal_forUpsert,
    output: thisCol.flow_ConnectivityNode_nameNew,
    operationType: OperationType.sync,
    pipeline: [
      {
        $match: { number: 1 },
      },
      {
        $match: { $expr: "$nodeProcessorId" },
      },
      ...getNodeNameByTapSteps("lsId"),
      {
        $group: {
          _id: "$nodeProcessorId",
          name: { $first: "$name" },
        },
      },
    ],
  },
  // По новым узлам КА
  {
    src: __filename,
    input: thisCol.flow_Terminal_forUpsert,
    output: thisCol.flow_ConnectivityNode_nameNew,
    operationType: OperationType.sync,
    pipeline: new Pipeline()
      // .match({ number: 1 })
      .matchExpr("$nodeProcessorId")
      .entityExtId("equipmentProcessorId", "processor")
      .lookupSelf("e")
      .unwindEntity()
      .matchExpr({ $ne: ["$e.type", "ACLineSegment"] })
      
      .group({
        _id: "$nodeProcessorId",
        name: { $first: "$e.model.IdentifiedObject_name" },
      })
      .build(),
  },
];

function prepExistingSteps() {
  return [
    {
      $group: {
        _id: "$nodePlatformId",
      },
    },
    {
      $match: { $expr: "$_id" },
    },
    {
      $lookup: {
        localField: "_id",
        from: col.dm_Terminal,
        foreignField: "model.Terminal_ConnectivityNode",
        as: "terminal",
      },
    },
    {
      $unwind: "$terminal",
    },
    
    {
      $addFields: {
        equipmentId: "$terminal.model.Terminal_ConductingEquipment",
      },
    },
  ];
}

function getNodeNameByTapSteps(firstLsId) {
  return [
    {
      $lookup: {
        localField: firstLsId,
        from: col.dm_LineSpan,
        foreignField: "id",
        as: "firstLs",
      },
    },
    {
      $unwind: "$firstLs",
    },
    {
      $match: {
        $expr: "$firstLs.model.LineSpan_isTapBegin",
      },
    },
    {
      $lookup: {
        localField: "firstLs.model.LineSpan_AccountPartLine",
        from: col.dm_AccountPartLine,
        foreignField: "id",
        as: "apl",
      },
    },
    {
      $unwind: "$apl",
    },
    {
      $addFields: {
        name: "$apl.model.IdentifiedObject_name",
      },
    },
    {
      $addFields: {
        clearName: {
          $regexFind: { input: "$name", regex: "Отпайка [0-9]+" },
        },
      },
    },
    {
      $addFields: {
        name: { $ifNull: ["$clearName.match", "$name"] },
      },
    },
  ];
}

// compileFlow(flows[2] as SingleStepFlow)
