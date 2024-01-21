import {
  Flow,
  MultiStepFlow,
  OperationType,
} from "_sys/classes/Flow";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import * as trig from "triggers"

export const flow: MultiStepFlow = {
  trigger: trig.trigger_BuildLineMatchSchema,
  src: __filename,
  comment:
    "Формирование элементов для схемы сопоставления пролетов и сегментов",
  operation: [
    {
      comment: "Узлы по пролетам",
      input: thisCol.LineSpanSchemaNodes,
      output: thisCol.LineMatchSchemaNodes,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [],
    },
    {
      comment: "Ребра по пролетам",
      input: thisCol.LineSpanSchemaEdges,
      output: thisCol.LineMatchSchemaEdges,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [],
    },
    {
      comment: "Узлы по сегментам",
      input: thisCol.LineSegmentSchemaNodes,
      output: thisCol.LineMatchSchemaNodes,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [],
    },
    {
      comment: "Ребра по сегментам",
      input: thisCol.LineSegmentSchemaEdges,
      output: thisCol.LineMatchSchemaEdges,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [],
    },
    // {
    //   comment: "Объединение схем связями",
    //   input: thisCol.LineSegmentSchemaEdges,
    //   output: thisCol.LineMatchSchemaEdges,
    //   operationType: OperationType.insert,
    //   useDefaultFilter: false,
    //   pipeline: [
    //     {
    //       $lookup: {
    //         from: thisCol.LineSpanSchemaEdges,
    //         localField: "firstLineSpan",
    //         foreignField: "id",
    //         as: "firstLs",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$firstLs",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     {
    //       $lookup: {
    //         from: thisCol.LineSpanSchemaEdges,
    //         localField: "lastLineSpan",
    //         foreignField: "id",
    //         as: "lastLs",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$lastLs",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     {
    //       $project: {
    //         items: [
    //           {
    //             fromId: "$fromId",
    //             toId: "$firstLs.fromId",
    //           },
    //           {
    //             fromId: "$toId",
    //             toId: "$lastLs.toId",
    //           },
    //         ],
    //       },
    //     },
    //     {
    //       $unwind: "$items",
    //     },
    //     {
    //       $match: { $expr: "$items.toId" },
    //     },
    //     {
    //       $group: {
    //         _id: { fromId: "$items.fromId", toId: "$items.toId" },
    //       },
    //     },
    //     {
    //       $project: {
    //         _id: false,
    //         id: { $concat: ["$_id.fromId", "-x"] },
    //         fromId: "$_id.fromId",
    //         toId: "$_id.toId",
    //         toLineEnd: "none",
    //         isAssociation: { $literal: true },
    //       },
    //     },
    //   ],
    // },
  ],
};

// utils.compileFlow(flow.operation[4] as SingleStepFlow);
