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
import * as trig from "triggers";

function terminalIndex(objectPath: string) {
  return {
    $ifNull: [
      `${objectPath}.Terminal_index`,
      `${objectPath}.ACDCTerminal_sequenceNumber`,
    ],
  };
}

const orgId = "c6ea45dd-2164-45f9-94ff-4c00d23b5fbb";
export const flow: MultiStepFlow = {
  trigger: trig.trigger_BuildLineTree,
  src: __filename,
  operation: [
    {
      comment: "Сбор оборудования по линиям",
      input: col.dm_Line,
      output: thisCol.LineEquipment,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        // {
        //   $match: {
        //     "extId.КИСУР": {
        //       $in: [
        //         "VS010-0009857",
        //         // "01a58022-f695-4dfd-931f-a3b4b03da23d",
        //         // "c9b18000-b101-41fd-8de5-c33771f0d240",
        //         // "a3c14a03-9d1c-413d-8099-27f2ff55232a",
        //         // "4bec9910-ea0f-42b3-9105-b230b61d9d05", // ВЛ-10-5
        //         // "ecd12449-a868-48cf-852e-bcfb47f93168", // ВЛ-10-6
        //         // "f1bce91f-74e2-4278-af0f-58890b91cac1" // тест
        //         //Закольцованные линии:
        //         // "08332f70-49bf-4cc7-8c61-a2f45e942972", // вл-10-5
        //         // "62172f93-f5c7-4567-b0ec-9d80f9721181", // вл-10-3
        //       ],
        //     },
        //   },
        // },
        {
          $project: {
            line: "$$ROOT",
          },
        },
        {
          $lookup: {
            from: "model_Links",
            let: { lineId: "$line.id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$toId", "$$lineId"],
                  },
                },
              },
              { $match: { predicate: "Equipment_EquipmentContainer" } },
            ],
            as: "lineEquipment",
          },
        },
        {
          $unwind: "$lineEquipment",
        },
        {
          $lookup: {
            from: "model_Entities",
            localField: "lineEquipment.fromId",
            foreignField: "id",
            as: "lineEquipment",
          },
        },
        {
          $unwind: "$lineEquipment",
        },
        {
          $lookup: {
            from: col.dm_ACLineSegment,
            localField: "lineEquipment.id",
            foreignField: "id",
            as: "buffer.segment",
          },
        },
        {
          $unwind: {
            path: "$buffer.segment",
            preserveNullAndEmptyArrays: true,
          },
        },
        ...new Pipeline()
          .entityId("lineEquipment.id")
          .lookupParent("IdentifiedObject_OrganisationRoles", "r")
          .unwindEntity(true)
          .build(),
        {
          $project: {
            _id: false,
            "line.id": "$line.id",
            "line.code": "$line.extId.КИСУР",
            "line.name": "$line.model.IdentifiedObject_name",
            "lineEquipment.id": "$lineEquipment.id",
            "lineEquipment.isConsumerEquipment": {
              $ne: [
                {
                  $ifNull: ["$r.id", orgId],
                },
                orgId,
              ],
            },
            "lineEquipment.code": "$lineEquipment.extId.processor",
            "lineEquipment.name": "$lineEquipment.model.IdentifiedObject_name",
            "lineEquipment.type": "$lineEquipment.type",
            "lineEquipment.firstLineSpan":
              "$buffer.segment.model.ACLineSegment_FirstLineSpan",
            "lineEquipment.lastLineSpan":
              "$buffer.segment.model.ACLineSegment_LastLineSpan",
            "lineEquipment.isTap": "$buffer.segment.model.ACLineSegment_isTap",
          },
        },
        {
          $lookup: {
            from: "dm_Terminal",
            let: { lineEquipmentId: "$lineEquipment.id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$model.Terminal_ConductingEquipment",
                      "$$lineEquipmentId",
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: false,
                  id: "$id",
                  number: terminalIndex("$model"),
                  "node.id": "$model.Terminal_ConnectivityNode",
                },
              },
            ],
            as: "terminals",
          },
        },
        {
          $addFields: {
            "lineEquipment.terminal1": {
              $filter: {
                input: "$terminals",
                as: "terminal",
                cond: { $eq: ["$$terminal.number", 1] },
              },
            },
            "lineEquipment.terminal2": {
              $filter: {
                input: "$terminals",
                as: "terminal",
                cond: { $eq: ["$$terminal.number", 2] },
              },
            },
            terminals: "$$REMOVE",
          },
        },
        { $unwind: "$lineEquipment.terminal1" },
        { $unwind: "$lineEquipment.terminal2" },
        {
          $unset: "buffer",
        },
      ],
    },
    {
      comment: "Добавление полей для работы с деревом",
      input: thisCol.LineEquipment,
      output: thisCol.LineEquipmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $addFields: {
            "buffer.parentNodeId": {
              $ifNull: ["$lineEquipment.terminal1.node.id", "-"],
            },
          },
        },
        {
          $lookup: {
            from: thisCol.LineEquipment,
            localField: "buffer.parentNodeId",
            foreignField: "lineEquipment.terminal2.node.id",
            as: "parentBuffer",
          },
        },
        {
          $unwind: {
            path: "$parentBuffer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            parent: {
              $cond: [
                "$parentBuffer",
                { lineEquipment: "$parentBuffer.lineEquipment" },
                { lineEquipment: { id: null } },
              ],
            },
            isRoot: { $cond: ["$parentBuffer", false, true] },
            parentBuffer: "$$REMOVE",
          },
        },
        {
          $addFields: {
            "buffer.nodeId": {
              $ifNull: ["$lineEquipment.terminal2.node.id", "-"],
            },
          },
        },
        {
          $lookup: {
            from: thisCol.LineEquipment,
            localField: "buffer.nodeId",
            foreignField: "lineEquipment.terminal1.node.id",
            as: "children",
          },
        },
        {
          $addFields: {
            isLeaf: { $eq: [{ $size: "$children" }, 0] },
            children: "$$REMOVE",
          },
        },
        {
          $unset: ["buffer", "_id"],
        },
      ],
    },
    {
      comment: "Схлопывание ком. аппаратов",
      input: thisCol.LineEquipmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $lookup: {
            from: thisCol.LineEquipmentTree,
            localField: "parent.lineEquipment.id",
            foreignField: "lineEquipment.id",
            as: "parentItem",
          },
        },
        {
          $unwind: {
            path: "$parentItem",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            switch: {
              $cond: [
                { $eq: ["$parentItem.lineEquipment.type", "ACLineSegment"] },
                "$$REMOVE",
                "$parentItem.lineEquipment",
              ],
            },
          },
        },
        {
          $addFields: {
            parent: {
              $cond: [
                "$switch",
                { lineEquipment: "$parentItem.parent.lineEquipment" },
                "$parent",
              ],
            },
            parentItem: "$$REMOVE",
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ["$lineEquipment.type", "ACLineSegment"] },
                "$isLeaf",
                "$isRoot",
                "$switch",
              ],
            },
          },
        },
        {
          $unset: "_id",
        },
      ],
    },
    {
      comment: "Сбор информации о конечных элементах",
      input: thisCol.LineSegmentTree,
      output: thisCol.EndElements,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [{ $eq: ["$isLeaf", true] }, { $eq: ["$isRoot", true] }],
            },
          },
        },
        {
          $lookup: {
            from: "dm_Terminal",
            let: {
              nodeId: {
                $cond: [
                  "$isRoot",
                  { $ifNull: ["$lineEquipment.terminal1.node.id", "-"] },
                  { $ifNull: ["$lineEquipment.terminal2.node.id", "-"] },
                ],
              },
              requiredTerminalNumber: {
                $cond: ["$isRoot", 2, 1],
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$model.Terminal_ConnectivityNode", "$$nodeId"],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: [terminalIndex("$model"), "$$requiredTerminalNumber"],
                  },
                },
              },
            ],
            as: "buffer.terminal",
          },
        },
        {
          $unwind: "$buffer.terminal",
        },
        {
          $lookup: {
            from: "model_Entities",
            localField: "buffer.terminal.model.Terminal_ConductingEquipment",
            foreignField: "id",
            as: "buffer.equipment",
          },
        },
        {
          $unwind: "$buffer.equipment",
        },
        {
          $graphLookup: {
            from: "model_Links",
            startWith: "$buffer.equipment.id",
            connectFromField: "toId",
            connectToField: "fromId",
            as: "buffer.parents",
            depthField: "depth",
            restrictSearchWithMatch: {
              $expr: { $eq: ["$predicate", "IdentifiedObject_ParentObject"] },
              // $expr: {$eq: ["$predicate", "Equipment_EquipmentContainer"]},
            },
          },
        },
        // {
        //   $addFields: {
        //     "buffer.rootParentDepth": {
        //       $subtract: [{ $size: "$buffer.parents" }, 1],
        //     },
        //   },
        // },
        // {
        //   $addFields: {
        //     "buffer.rootParent": {
        //       $filter: {
        //         input: "$buffer.parents",
        //         as: "parent",
        //         cond: { $eq: ["$$parent.depth", "$buffer.rootParentDepth"] },
        //       },
        //     },
        //   },
        // },
        {
          $addFields: {
            "buffer.rootParent": {
              $filter: {
                input: "$buffer.parents",
                as: "parent",
                cond: { $eq: ["$$parent.toType", "Substation"] },
              },
            },
          },
        },
        { $unwind: "$buffer.rootParent" },
        {
          $group: {
            _id: {
              lineEquipmentId: "$lineEquipment.id",
              endElementId: "$buffer.rootParent.toId",
            },
            endEquipment: {
              $push: {
                id: "$buffer.equipment.id",
                type: "$buffer.equipment.type",
                name: "$buffer.equipment.model.IdentifiedObject_name",
                terminal: {
                  id: "$buffer.terminal.id",
                  number: terminalIndex("$buffer.terminal.model"),
                  node: {
                    id: "$buffer.terminal.model.Terminal_ConnectivityNode",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: {
              lineEquipmentId: "$_id.lineEquipmentId",
            },
            endElementIds: { $push: "$_id.endElementId" },
            endElementId: { $first: "$_id.endElementId" },
            endEquipment: { $first: "$endEquipment" },
          },
        },
        {
          $project: {
            _id: false,
            "lineEquipment.id": "$_id.lineEquipmentId",
            "endElement.id": "$endElementId",
            "dataForCheck.endElement.ids": "$endElementIds",
            "endElement.connections": "$endEquipment",
          },
        },
        {
          $lookup: {
            from: "model_Entities",
            localField: "endElement.id",
            foreignField: "id",
            as: "buffer.endElement",
          },
        },
        { $unwind: "$buffer.endElement" },
        {
          $addFields: {
            "endElement.name": "$buffer.endElement.model.IdentifiedObject_name",
            "endElement.type": "$buffer.endElement.type",
            "endElement.code":
              "$buffer.endElement.model.PowerSystemResource_ccsCode",
            buffer: "$$REMOVE",
          },
        },
      ],
    },
    {
      comment: "Добавление информации о конечных элементах в дерево",
      input: thisCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $lookup: {
            from: thisCol.EndElements,
            localField: "lineEquipment.id",
            foreignField: "lineEquipment.id",
            as: "buffer",
          },
        },
        {
          $unwind: {
            path: "$buffer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            endElement: "$buffer.endElement",
            dataForCheck: {
              $mergeObjects: ["$dataForCheck", "$buffer.dataForCheck"],
            },
            buffer: "$$REMOVE",
          },
        },
      ],
    },
    {
      comment:
        "Бывают случаи, когда конечным оборудованием является не acls а ком. аппарат. В этом случаи убираем такой элемент из дерева и переносим его в предшествующий acls в качестве конечного оборудования. Шаг 1 перенос",
      input: thisCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.sync,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isLeaf: true } },
        { $match: { "lineEquipment.type": { $ne: "ACLineSegment" } } },
        {
          $lookup: {
            from: thisCol.LineSegmentTree,
            localField: "parent.lineEquipment.id",
            foreignField: "lineEquipment.id",
            as: "p",
          },
        },
        {
          $unwind: {
            path: "$p",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "p.endElement": "$lineEquipment",
            "p.isLeaf": true,
          },
        },
        {
          $addFields: {
            "p.endElement.isSwitch": true,
          },
        },
        {
          $replaceRoot: { newRoot: "$p" },
        },
      ],
    },
    {
      comment: "См. пред шаг. Шаг 2 удаление",
      input: thisCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [{ $match: { "lineEquipment.type": "ACLineSegment" } }],
    },
    {
      comment:
        "Соединение дерева через рекурсивный запрос, чтобы убедиться что нет разрывов и неоднозначных связей",
      input: sysCol.sys_Dummy,
      output: thisCol.LineSegmentTree_Depth,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $graphLookup: {
            from: thisCol.LineSegmentTree,
            startWith: null,
            connectFromField: "lineEquipment.id",
            connectToField: "parent.lineEquipment.id",
            as: "tree",
            depthField: "depth",
          },
        },
        { $unwind: "$tree" },
        { $replaceRoot: { newRoot: "$tree" } },
        {
          $project: {
            _id: false,
            "line.id": true,
            "lineEquipment.id": true,
            depth: true,
          },
        },
      ],
    },
    {
      comment:
        "Добавление номера сегмента в пределах линии для более удобного анализа на диаграммах",
      input: thisCol.LineSegmentTree_Depth,
      output: thisCol.LineSegmentTree_Index,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .group({
          _id: "$lineEquipment.id",
          depth: { $first: "$depth" },
          lineId: { $first: "$line.id" },
        })
        .sort({ lineId: 1, depth: 1 })
        .group({ _id: "$lineId", segmentId: { $push: "$_id" } })
        .unwind({ path: "$segmentId", includeArrayIndex: "index" })
        .unset("_id")
        .build(),
    },
    {
      comment: "Добавление поля с глубиной элемента в дерево сегментов",
      input: thisCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $lookup: {
            from: thisCol.LineSegmentTree_Depth,
            localField: "lineEquipment.id",
            foreignField: "lineEquipment.id",
            as: "buffer",
          },
        },
        {
          $addFields: {
            dataForCheck: {
              $mergeObjects: ["$dataForCheck", { depth: "$buffer.depth" }],
            },
            buffer: "$$REMOVE",
          },
        },
        {
          $lookup: {
            from: thisCol.LineSegmentTree_Index,
            localField: "lineEquipment.id",
            foreignField: "segmentId",
            as: "buffer",
          },
        },
        {
          $addFields: {
            index: { $first: "$buffer.index" },
            buffer: "$$REMOVE",
          },
        },
      ],
    },
    {
      comment: "Проверки. Заполнение поля errors.",
      input: thisCol.LineSegmentTree,
      output: thisCol.LineSegmentTree,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $addFields: {
            "dataForCheck.depth": { $ifNull: ["$dataForCheck.depth", []] },
            "dataForCheck.endElement.ids": {
              $ifNull: ["$dataForCheck.endElement.ids", []],
            },
          },
        },
        {
          $addFields: {
            errors: [
              {
                $cond: [
                  { $ne: ["$lineEquipment.type", "ACLineSegment"] },
                  "Некорректный тип элемента, ожидался ACLineSegment",
                  null,
                ],
              },
              {
                $cond: [
                  { $eq: [{ $size: "$dataForCheck.depth" }, 0] },
                  "Не доступен при проходе по дереву",
                  null,
                ],
              },
              {
                $cond: [
                  { $gt: [{ $size: "$dataForCheck.depth" }, 1] },
                  "Неоднозначное положение в дереве, доступен от корня по нескольким путям",
                  null,
                ],
              },
              {
                $cond: [
                  { $gt: [{ $size: "$dataForCheck.endElement.ids" }, 1] },
                  "Не возможно однозначно определить конечный элемент",
                  null,
                ],
              },
              {
                $cond: [
                  {
                    $and: [
                      { $lt: [{ $size: "$dataForCheck.endElement.ids" }, 1] },
                      "$isLeaf",
                    ],
                  },
                  "Конечный элемент не найден",
                  null,
                ],
              },
              {
                $cond: [
                  {
                    $and: [{ $not: "$endElement.code" }, "$isLeaf"],
                  },
                  "У конечного элемента отсутствует код SAP",
                  null,
                ],
              },
            ],
          },
        },
        {
          $addFields: {
            errors: {
              $filter: {
                input: "$errors",
                as: "error",
                cond: "$$error",
              },
            },
          },
        },
        {
          $addFields: {
            errors: {
              $cond: [
                { $gt: [{ $size: "$errors" }, 0] },
                "$errors",
                "$$REMOVE",
              ],
            },
          },
        },
      ],
    },
  ],
};

// var flow1: MultiStepFlow = {
//   trigger: thisCol.trigger_BuildLineTree,
//   src: __filename,
//   operation: [
//     flow.operation[0],
//     flow.operation[1],
//     // , flow.operation[2]
//   ],
// };

// utils.compileFlow(flow.operation[0]);
