import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import { comment } from "_sys/utils";

let fromNodeExpr = {
  $cond: [
    "$switch",
    "$switch.terminal1.node.id",
    {
      $ifNull: [
        "$lineEquipment.terminal1.node.id",
        "$lineEquipment.terminal1.id",
      ],
    },
  ],
};
function splitEdgesStep() {
  return [
    comment(
      "Ребра разбиваются на 2 части чтобы вставить узел с ярлыком. Так схема отрисовывается лучше чем с текстом на ребре"
    ),
    {
      $project: {
        _id: false,
        data: [
          {
            fromId: "$fromId",
            id: { $concat: ["$id", "-1"] },
            aclsId: "$id",
            toId: { $concat: ["$id", "-label"] },
            label: "$text",
            toLineEnd: "none",
            isFirst: true,
            lineSpan: "$firstLineSpan",
            fromPointIndex: "$fromPointIndex",
            lineCode: "$lineCode",
            index: "$index",
            isConsumerEquipment: "$isConsumerEquipment",
          },
          {
            fromId: { $concat: ["$id", "-label"] },
            id: { $concat: ["$id", "-2"] },
            aclsId: "$id",
            toId: "$toId",
            label: "$text",
            toLineEnd: "arrow",
            lineSpan: "$lastLineSpan",
            fromPointIndex: 2,
            lineCode: "$lineCode",
            index: "$index",
            isConsumerEquipment: "$isConsumerEquipment",
          },
        ],
      },
    },
    { $unwind: "$data" },
    {
      $lookup: {
        from: col.dm_LineSpan,
        foreignField: "id",
        localField: "data.lineSpan",
        as: "ls",
      },
    },
    {
      $unwind: {
        path: "$ls",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $set: {
        "data.text": "$ls.extId.КИСУР",
      },
    },
    {
      $set: {
        "data.needMatch": {
          $and: [{ $not: "$data.isConsumerEquipment" }, { $not: "$data.text" }],
        },
        "data.matched": {
          $cond: ["$data.text", true, false],
        },
      },
    },
    { $replaceRoot: { newRoot: "$data" } },
  ];
}

export const flow: MultiStepFlow = {
  trigger: prepCol.LineSegmentTree,
  src: __filename,
  comment: "Формирование элементов по линии для отображения на схеме сегментов",
  operation: [
    {
      comment: "Фильтрация конечных ком. аппаратов",
      input: prepCol.LineSegmentTree,
      output: thisCol.LineSegmentSchemaBuffer,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        // { $match: {"lineEquipment.type":"ACLineSegment" } },
      ],
    },
    {
      comment: "Формирование узлов по корневым элементам",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaNodes,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isRoot: true } },
        {
          $project: {
            _id: false,
            id: fromNodeExpr,
            text: "$endElement.name",
            type: "df.endElement",
            lineCode: "$line.code",
            isRoot: true,
          },
        },
      ],
    },
    {
      comment: "Формирование узлов по сегментам",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isRoot: false } },
        {
          $group: {
            _id: fromNodeExpr,
            item: { $first: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: false,
            id: "$_id",
            switchCode: "$item.switch.code",
            text: {
              $cond: [
                "$item.switch",
                { $ifNull: ["$item.switch.code", "$item.switch.id"] },
                null,
              ],
            },
            type: { $cond: ["$item.switch", "df.switch", "df.node"] },
            isConsumerEquipment: "$item.switch.isConsumerEquipment",
            lineCode: "$item.line.code",
          },
        },
      ],
    },
    {
      comment: "Формирование узлов по конечным элементам ПС",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isLeaf: true } },
        { $match: { $expr: { $not: "$endElement.isSwitch" } } },
        {
          $project: {
            _id: false,
            id: "$lineEquipment.terminal2.id",
            text: "$endElement.name",
            type: "df.endElement",
            lineCode: "$line.code",
            isConsumerEquipment: "$lineEquipment.isConsumerEquipment",
          },
        },
      ],
    },
    {
      comment: "Формирование узлов по конечным элементам КА",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isLeaf: true } },
        { $match: { $expr: "$endElement.isSwitch" } },
        {
          $project: {
            _id: false,
            id: "$lineEquipment.terminal2.id",
            text: { $ifNull: ["$endElement.code", "$endElement.id"] },
            type: "df.switch",
            lineCode: "$line.code",
            switchCode: "$endElement.code",
            isConsumerEquipment: "$lineEquipment.isConsumerEquipment",
          },
        },
      ],
    },
    {
      comment: "Формирование ребер по промежуточным сегментам",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaEdges,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isLeaf: false } },
        {
          $project: {
            fromId: fromNodeExpr,
            id: "$lineEquipment.id",
            text: "$lineEquipment.name",
            toId: "$lineEquipment.terminal2.node.id",
            firstLineSpan: "$lineEquipment.firstLineSpan",
            lastLineSpan: "$lineEquipment.lastLineSpan",
            fromPointIndex: { $cond: ["$lineEquipment.isTap", 1, 2] },
            lineCode: "$line.code",
            isConsumerEquipment: "$lineEquipment.isConsumerEquipment",
            index: "$index",
          },
        },
        ...splitEdgesStep(),
      ],
    },
    {
      comment: "Формирование ребер по конечным сегментам",
      input: thisCol.LineSegmentSchemaBuffer,
      output: thisCol.LineSegmentSchemaEdges,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { isLeaf: true } },
        {
          $project: {
            _id: false,
            fromId: fromNodeExpr,
            id: "$lineEquipment.id",
            text: "$lineEquipment.name",
            toId: "$lineEquipment.terminal2.id", // разница тут
            firstLineSpan: "$lineEquipment.firstLineSpan",
            lastLineSpan: "$lineEquipment.lastLineSpan",
            fromPointIndex: { $cond: ["$lineEquipment.isTap", 1, 2] },
            lineCode: "$line.code",
            isConsumerEquipment: "$lineEquipment.isConsumerEquipment",
            index: "$index",
          },
        },
        ...splitEdgesStep(),
      ],
    },
    {
      comment: "Формирование узлов c ярлыками ребер",
      input: thisCol.LineSegmentSchemaEdges,
      output: thisCol.LineSegmentSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { $expr: "$isFirst" } },
        { $sort: { fromPointIndex: -1 } },
        {
          $project: {
            _id: false,
            id: "$toId",
            text: {
              $concat: [
                "$label",
                " ",
                "[",
                { $toString: "$index" },
                "]",
                "$aclsId",
              ],
            },
            type: "df.segment",
            lineCode: "$lineCode",
            aclsId:"$aclsId",
            aclsName:"$label",
            isConsumerEquipment: "$isConsumerEquipment",
            matched: "$matched",
            needMatch: "$needMatch",
          },
        },
      ],
    },
  ],
};

// utils.compileFlow(flow)
