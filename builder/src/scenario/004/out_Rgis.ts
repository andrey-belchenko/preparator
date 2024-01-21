import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import { compileFlow, compileObject } from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: col.in_skNodeStatusResponse,
  output: col.out_Rgis,
  operationType: OperationType.insert,
  pipeline: [
    //lookup Line по ccsCode
    {
      $lookup: {
        from: "dm_Line",
        localField: "requestInfo.Тело.КодТехническогоОбъекта",
        foreignField: "extId.КИСУР",
        as: "line",
      },
    },
    { $unwind: "$line" },
    {
      $addFields: {
        showSegment: { $eq: ["$requestInfo.Тело.ВключитьACLineSegment", "да"] },
        showLineSpan: {
          $eq: ["$requestInfo.Тело.ВключитьПролётыACLineSegment", "да"],
        },
      },
    },
    ...pipelineSteps(),
  ],
};

export function bufferPipelineSteps() {
  return [
    //lookup ACLineSegment
    {
      $lookup: {
        from: "dm_ACLineSegment",
        localField: "line.id",
        foreignField: "model.Equipment_EquipmentContainer",
        as: "segment",
      },
    },
    { $unwind: "$segment" },
    // lookup SvTopology через терминал 1
    ...lookupTopology(1),
    // lookup SvTopology через терминал 2
    ...lookupTopology(2),
    // оставляем только нужные поля
    {
      $group: {
        _id: "$segment.id",
        data: {
          $first: {
            lineCode: "$line.extId.КИСУР",
            lineId: "$line.id",
            segmentId: "$segment.id",
            energized1: "$tpl1.model.SvTopology_Energized",
            grounded1: "$tpl1.model.SvTopology_Grounded",
            energized2: "$tpl2.model.SvTopology_Energized",
            grounded2: "$tpl2.model.SvTopology_Grounded",
            showSegment: "$showSegment",
            showLineSpan: "$showLineSpan",
          },
        },
      },
    },
    { $replaceRoot: { newRoot: "$data" } },
    // {
    //   $project: {
    //     lineCode: "$line.extId.КИСУР",
    //     lineId: "$line.id",
    //     segmentId: "$segment.id",
    //     energized1: "$tpl1.model.SvTopology_Energized",
    //     grounded1: "$tpl1.model.SvTopology_Grounded",
    //     energized2: "$tpl2.model.SvTopology_Energized",
    //     grounded2: "$tpl2.model.SvTopology_Grounded",
    //     showSegment: "$showSegment",
    //     showLineSpan: "$showLineSpan",
    //   },
    // },
    // вычисление статуса ACLineSegment
    {
      $addFields: {
        segmentStatus: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $eq: ["$energized1", -1] },
                    { $eq: ["$grounded1", -1] },
                    { $eq: ["$energized2", -1] },
                    { $eq: ["$grounded2", -1] },
                  ],
                },
                then: 2,
              },
              {
                case: {
                  $and: [
                    { $eq: ["$energized1", 1] },
                    { $eq: ["$grounded1", -1] },
                    { $eq: ["$energized2", 1] },
                    { $eq: ["$grounded2", -1] },
                  ],
                },
                then: 1,
              },
              {
                case: {
                  $and: [
                    { $eq: ["$energized1", -1] },
                    { $in: ["$grounded1", [1, 2]] },
                    { $eq: ["$energized2", -1] },
                    { $in: ["$grounded2", [1, 2]] },
                  ],
                },
                then: 0,
              },
            ],
            default: -1,
          },
        },
      },
    },
    {
      $addFields: {
        segmentStatus: { $toInt: "$segmentStatus" },
        // status: { $toString: "$status" },
      },
    },
    // Вычисление статуса линии
    {
      $group: {
        _id: "$lineId",
        status_max: { $max: "$segmentStatus" },
        status_min: { $min: "$segmentStatus" },
        item: { $push: "$$ROOT" },
      },
    },
    {
      $addFields: {
        "item.lineStatus": {
          $switch: {
            branches: [
              // TODO вроде ерунда, можно просто взять min
              {
                case: { $eq: ["$status_max", "$status_min"] },
                then: "$status_max",
              },
              {
                case: { $ne: ["$status_max", "$status_min"] },
                then: "$status_min",
              },
            ],
            default: null,
          },
        },
      },
    },
    {
      $unwind: "$item",
    },
    { $replaceRoot: { newRoot: "$item" } },
  ];
}

export function finalPipelineSteps() {
  return [
    // подтягиваем LineSpan, и сразу преобразуем к выходному виду
    {
      $lookup: {
        from: "dm_LineSpan",
        let: {
          segmentId: "$segmentId",
          segmentStatus: "$segmentStatus",
          showLineSpan: "$showLineSpan",
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$model.LineSpan_ACLineSegment", "$$segmentId"] },
            },
          },
          {
            $project: {
              _id: false,
              КодТехническогоОбъекта: "$extId.КИСУР",
              Статус: { $toString: "$$segmentStatus" },
            },
          },
        ],
        as: "lineSpans",
      },
    },
    // преобразуем ACLineSegment к выходному виду
    {
      $addFields: {
        segment: {
          mRID: "$segmentId",
          Статус: { $toString: "$segmentStatus" },
          Пролёты: {
            $cond: ["$showLineSpan", "$lineSpans", "$$REMOVE"],
          },
        },
      },
    },
    // группировка по коду линии с записью сегментов в массив
    {
      $group: {
        _id: "$lineId",
        showSegment: { $first: "$showSegment" },
        lineCode: { $first: "$lineCode" },
        // status: { $min: "$segment.Статус" },
        // status_max: { $max: "$segment.Статус" },
        // status_min: { $min: "$segment.Статус" },
        lineStatus: { $first: "$lineStatus" },
        ACLineSegment: { $push: "$segment" },
      },
    },
    // финальный вид
    {
      $project: {
        _id: false,
        queueName: "LINE_STATE.ASTU.IN",
        payload: {
          СистемаИсточник: "ЕИП",
          КодСобытия: "ОтветСостояниеЛЭП",
          ДатаФормированияСообщения: "$$NOW",
          Тело: {
            ЭлементСтруктурыСети: [
              {
                КодТехническогоОбъекта: "$lineCode",
                // СтатусЛЭП: "$status",
                СтатусЛЭП: { $toString: "$lineStatus" } ,
                //  {
                //   $switch: {
                //     branches: [
                //       {
                //         case: { $eq: ["$status_max", "$status_min"] },
                //         then: { $toString: "$status_max" },
                //       },
                //       {
                //         case: { $ne: ["$status_max", "$status_min"] },
                //         then: { $toString: "$status_min" },
                //       },
                //     ],
                //     default: null,
                //   },
                // },
                ACLineSegment: {
                  $cond: ["$showSegment", "$ACLineSegment", "$$REMOVE"],
                },
              },
            ],
          },
        },
        // для отображения в витрине
        objectId: "$lineCode",


      },
    },
  ];
}

export function pipelineSteps() {
  return [...bufferPipelineSteps(), ...finalPipelineSteps()];
}
function lookupTopology(tNum) {
  let fieldsExpr = {};
  fieldsExpr["node" + tNum + "Id"] = { $ifNull: ["$node" + tNum + ".id", "-"] };

  return [
    {
      $lookup: {
        from: "dm_Terminal",
        let: { segmentId: "$segment.id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$model.Terminal_ConductingEquipment", "$$segmentId"],
              },
            },
          },
          {
            $match: {
              "model.ACDCTerminal_sequenceNumber": tNum,
            },
          },
        ],
        as: "t" + tNum,
      },
    },
    { $unwind: "$t" + tNum },
    {
      $lookup: {
        from: "dm_ConnectivityNode",
        localField: "t" + tNum + ".model.Terminal_ConnectivityNode",
        foreignField: "id",
        as: "node" + tNum,
      },
    },
    { $unwind: { path: "$node" + tNum, preserveNullAndEmptyArrays: true } },
    { $addFields: fieldsExpr },
    {
      $lookup: {
        from: "dm_SvTopology",
        localField: "node" + tNum + "Id",
        foreignField: "model.SvTopology_ConnectivityNode",
        as: "tpl" + tNum,
      },
    },
    { $unwind: { path: "$tpl" + tNum, preserveNullAndEmptyArrays: true } },
  ];
}

// compileObject(flow.pipeline)
// compileFlow(flow);
