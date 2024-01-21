import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.in_Switches,
  output: col.flow_Switches_stat_new,
  operationType: OperationType.replace,
  pipeline: [
    // Выбираем последнее сообщение
    { $sort: { _id: -1 } },
    {
      $group: {
        _id: null,
        item: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$item" } },
    { $project: { _id: 0 } },
    { $unwind: "$value" },
    {
      $match: {
        "$expr": {
          $lt: ["$value.error", null]
        }
      }
    },
    // TO DO . У некоторых КА отсутствует timeStamp, чтобы сообщение корректно уходило в РГИС, заполняем timeStamp константой
    {
      $addFields: {
        'value.value.timeStamp': { $ifNull: ["$value.value.timeStamp", "1970-01-01T00:00:00.245Z"] } ,
      }
    },
  ],
}
