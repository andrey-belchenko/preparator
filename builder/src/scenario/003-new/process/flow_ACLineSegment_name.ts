import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_ACLineSegment_new,
  output: thisCol.flow_ACLineSegment_name,
  operationType: OperationType.replace,
  pipeline: new Pipeline()
    .match({ isSwitch: false })
    .addSteps(getNodeName("startTerminalId", "startName"))
    .addSteps(getNodeName("endTerminalId", "endName"))

    .entityId("lineId", "Line")
    .lookupSelf("line")
    .unwindEntity(true)

    .entityId("firstTowerId", "Tower")
    .lookupSelf("twr1")
    .unwindEntity(true)

    .entityId("lastTowerId", "Tower")
    .lookupSelf("twr2")
    .unwindEntity(true)

    .entityId("firstLsId", "LineSpan")
    .lookupSelf("ls1")
    .unwindEntity(true)

    .entityId("lastLsId", "LineSpan")
    .lookupSelf("ls2")
    .unwindEntity(true)

    .entityId("firstLsId")
    .lookupParent("LineSpan_AccountPartLine", "apl")
    .unwindEntity(true)
    .project({
      _id: "$_id",
      name: {
        $cond: [
          { $and: ["$startName", "$endName"] },
          // Приоритетный вариант именования, применяется если есть необходимая информация.
          // [Имя линии] [имя начальной точки] - [имя конечной точки]
          // Имя точки это ПС, КА или имя отпайки (идентифицирует точку где подключена отпайка)
          {
            $concat: [
              { $ifNull: ["$line.model.IdentifiedObject_name", "..."] },
              " ",
              "$startName",
              " - ",
              "$endName",
            ],
          },
          // Запасной вариант если нет необходимой информации для первого варианта
          // [Имя или код APL] [Начальная опора или сегмент] - [Конечная опора или сегмент]
          {
            $concat: [
              {
                $cond: [
                  { $eq: ["$apl.model.IdentifiedObject_name", ""] },
                  "$apl.extId.КИСУР",
                  "$apl.model.IdentifiedObject_name",
                ],
              },
              " ",
              {
                $ifNull: [
                  "$twr1.model.IdentifiedObject_name",
                  { $concat: ["(", "$ls1.model.IdentifiedObject_name", ")"] },
                ],
              },
              " - ",
              {
                $ifNull: [
                  "$twr2.model.IdentifiedObject_name",
                  { $concat: ["(", "$ls2.model.IdentifiedObject_name", ")"] },
                ],
              },
            ],
          },
        ],
      },
    })
    .build(),
};

function getNodeName(terminalId, fieldName) {
  var output = {};
  output[fieldName] = { $ifNull: ["$nameNew.name", "$nameExisting.name"] };
  return [
    {
      $lookup: {
        from: thisCol.flow_Terminal_new,
        localField: terminalId,
        foreignField: "_id",
        as: "terminal",
      },
    },
    { $unwind: "$terminal" },
    {
      $lookup: {
        from: thisCol.flow_ConnectivityNode_nameExisting,
        localField: "terminal.nodePlatformId",
        foreignField: "_id",
        as: "nameExisting",
      },
    },
    {
      $unwind: {
        path: "$nameExisting",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: thisCol.flow_ConnectivityNode_nameNew,
        localField: "terminal.nodeProcessorId",
        foreignField: "_id",
        as: "nameNew",
      },
    },
    {
      $unwind: {
        path: "$nameNew",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: output,
    },
    {
      $unset: ["terminal", "nameExisting", "nameNew"],
    },
  ];
}

// utils.compileFlow(flow);
