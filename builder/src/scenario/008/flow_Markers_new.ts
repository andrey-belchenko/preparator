import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.in_Markers,
  output: col.flow_Markers_new,
  operationType: OperationType.replace,
  pipeline: [
    // Выбираем только последнее сообщение
    { $sort: { "changedAt": 1 } },
    {
      $group: {
        _id: null,
        value: { $last: "$value" }
      }
    },
    { $unwind: '$value' },
    { $project: { _id: 0 } },

    // Проверка на наличие объекта в интеграционной БД
    {
      $lookup: {
        localField: "value.placedOn.uid",
        from: "model_Entities",
        foreignField: "initialId",
        as: "model_Entities"
      }
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: { model_Entities: { $ne: null } }
    }
  ],
}