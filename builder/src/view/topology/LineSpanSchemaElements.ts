import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import * as trig from "triggers"

export const flow: MultiStepFlow = {
  trigger: trig.trigger_BuildLineSpanSchema,
  src: __filename,
  comment: "Формирование элементов по линии для отображения на схеме пролетов",
  operation: [
    {
      comment: "Сбор данных в промежуточную коллекцию",
      input: col.dm_Line,
      output: thisCol.LineSpanSchemaBuffer,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        // { $match: { "extId.КИСУР": "VS010-0010081" } },
        {
          $lookup: {
            from: col.dm_AccountPartLine,
            localField: "id",
            foreignField: "model.AccountPartLine_Line",
            as: "apl",
          },
        },
        {
          $addFields: { apls: "$apl.id" },
        },
        {
          $unwind: "$apl",
        },
        {
          $addFields: {
            aplIndex: { $indexOfArray: ["$apls", "$apl.id"] },
          },
        },
        {
          $lookup: {
            from: col.dm_LineSpan,
            localField: "apl.id",
            foreignField: "model.LineSpan_AccountPartLine",
            as: "lineSpan",
          },
        },
        {
          $unwind: "$lineSpan",
        },
        {
          $addFields: {
            startTowerId: {
              $ifNull: ["$lineSpan.model.LineSpan_StartTower", "-"],
            },
            endTowerId: {
              $ifNull: ["$lineSpan.model.LineSpan_EndTower", "-"],
            },
          },
        },
        {
          $lookup: {
            from: col.dm_LineSpan,
            localField: "startTowerId",
            foreignField: "model.LineSpan_EndTower",
            as: "prev",
          },
        },
        {
          $unwind: { path: "$prev", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: col.dm_Tower,
            localField: "endTowerId",
            foreignField: "id",
            as: "endTower",
          },
        },
        {
          $unwind: { path: "$endTower", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: col.dm_Tower,
            localField: "startTowerId",
            foreignField: "id",
            as: "startTower",
          },
        },
        {
          $unwind: { path: "$startTower", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: col.dm_LineSpan,
            localField: "endTowerId",
            foreignField: "model.LineSpan_StartTower",
            as: "next",
          },
        },
        {
          $lookup: {
            from: col.model_Links,
            let: {
              lineSpanId: "$lineSpan.id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$toId", "$$lineSpanId"] },
                      { $eq: ["$predicate", "Switch_LineSpan"] },
                    ],
                  },
                },
              },
            ],
            as: "switchLink",
          },
        },
        {
          $unwind: { path: "$switchLink", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: sysCol.model_Entities,
            localField: "switchLink.fromId",
            foreignField: "id",
            as: "swtch",
          },
        },
        {
          $unwind: { path: "$swtch", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: prepCol.LineSegmentTree_Index,
            localField: "lineSpan.model.LineSpan_ACLineSegment",
            foreignField: "segmentId",
            as: "si",
          },
        },
        {
          $unwind: { path: "$si", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: false,
            lineCode: "$extId.КИСУР",
            id: "$lineSpan.id",
            name: "$lineSpan.extId.КИСУР",
            endTowerId: "$endTower.extId.КИСУР",
            startTowerId: "$startTower.extId.КИСУР",
            aplName: "$apl.model.IdentifiedObject_name",
            aplIndex: "$aplIndex",
            isFromSubstation: "$lineSpan.model.LineSpan_isFromSubstation",
            isToSubstation: "$lineSpan.model.LineSpan_isToSubstation",
            isInUse: "$lineSpan.model.LineSpan_isInUse",
            from: {
              $cond: [
                "$startTower.extId.КИСУР",
                "$startTower.extId.КИСУР",
                { $concat: ["Начало ", "$lineSpan.extId.КИСУР"] },
              ],
            },
            to: {
              $cond: [
                "$endTower.extId.КИСУР",
                "$endTower.extId.КИСУР",
                { $concat: ["Конец ", "$lineSpan.extId.КИСУР"] },
              ],
            },
            isFirst: {
              $cond: [
                {
                  $eq: [
                    "$lineSpan.model.LineSpan_AccountPartLine",
                    "$prev.model.LineSpan_AccountPartLine",
                  ],
                },
                false,
                true,
              ],
            },
            isRoot: { $cond: ["$prev.id", false, true] },
            isLeaf: { $cond: [{ $gt: [{ $size: "$next" }, 0] }, false, true] },
            switchId: "$swtch.extId.processor",
            segmentIndex: "$si.index",
            segmentId: "$lineSpan.model.LineSpan_ACLineSegment",
            wireInfo: {
              $concat: [
                { $cond: ["$lineSpan.model.LineSpan_aWireTypeName", "A", ""] },
                { $cond: ["$lineSpan.model.LineSpan_bWireTypeName", "B", ""] },
                { $cond: ["$lineSpan.model.LineSpan_cWireTypeName", "C", ""] },
                " ",
                {
                  $ifNull: [
                    "$lineSpan.model.LineSpan_aWireTypeName",
                    "$lineSpan.model.LineSpan_bWireTypeName",
                    "$lineSpan.model.LineSpan_cWireTypeName",
                  ],
                },
              ],
            },
          },
        },
      ],
    },
    // type: "df.endElement",
    {
      comment: "Конечные узлы",
      input: thisCol.LineSpanSchemaBuffer,
      output: thisCol.LineSpanSchemaNodes,
      operationType: OperationType.replace,
      pipeline: [
        {
          $group: {
            _id: "$to",
            item: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$item",
          },
        },
        {
          $project: {
            _id: false,
            id: "$to",
            lineCode: "$lineCode",
            label: "$to",
            type: {
              $cond: [
                { $and: ["$isLeaf", "$isToSubstation"] },
                "df.endElement",
                "df.tower",
              ],
            },
            aplIndex: "$aplIndex",
          },
        },
      ],
    },
    {
      comment: "Корневые узлы",
      input: thisCol.LineSpanSchemaBuffer,
      output: thisCol.LineSpanSchemaNodes,
      operationType: OperationType.insert,
      pipeline: [
        { $match: { isRoot: true } },
        {
          $project: {
            _id: false,
            id: "$from",
            lineCode: "$lineCode",
            label: "$from",
            type: {
              $cond: ["$isFromSubstation", "df.endElement", "df.tower"],
            },
            aplIndex: "$aplIndex",
          },
        },
      ],
    },
    {
      comment: "Грани",
      input: thisCol.LineSpanSchemaBuffer,
      output: thisCol.LineSpanSchemaEdges,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: [
        {
          $project: {
            _id: false,
            fromId: "$from",
            id: "$id",
            lineCode: "$lineCode",
            text: "$name",
            toId: "$to",
            segmentIndex: "$segmentIndex",
            segmentId: "$segmentId",
            wireInfo: "$wireInfo",
            isInUse:"$isInUse"
          },
        },
      ],
    },
    {
      comment: "Узлы по ком аппаратам",
      input: thisCol.LineSpanSchemaBuffer,
      output: thisCol.LineSpanSchemaNodes,
      operationType: OperationType.insert,
      pipeline: [
        { $match: { $expr: "$switchId" } },
        {
          $project: {
            _id: false,
            id: "$switchId",
            lineCode: "$lineCode",
            label: "$switchId",
            type: "df.switch",
          },
        },
      ],
    },
    {
      comment: "Грани по ком аппаратам",
      input: thisCol.LineSpanSchemaBuffer,
      output: thisCol.LineSpanSchemaEdges,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: [
        { $match: { $expr: "$switchId" } },
        {
          $project: {
            _id: false,
            fromId: "$startTowerId",
            id: { $concat: ["$switchId", "-"] },
            lineCode: "$lineCode",
            toId: "$switchId",
          },
        },
      ],
    },
  ],
};

// utils.compileFlow(flow.operation[0]);
