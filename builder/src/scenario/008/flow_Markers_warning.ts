import { info } from "console";
import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections"
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.in_Markers,
  output: sysCol.sys_Warning,
  operationType: OperationType.sync,
  mergeKey:"id",
  pipeline: [
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
      $match: { model_Entities: { $eq: null } },
    },
    { $sort: { changedAt: -1 } },
    {
      $project:
      {
        id: { $concat: ["marksPlatformUidUnknown_", "$value.placedOn.uid"] },
        message: { $concat: ["В СК-11 создана пометка для оборудования, которое отсутствует в платформе. Uid оборудования: ", "$value.placedOn.uid"] },
        data: {
          "Uid пометки": "$value.uid",
          "Uid оборудования": "$value.placedOn.uid",
          "Название оборудования": "$value.placedOn.name",
          "Дата создания пометки": "$value.createdDateTime",
        }
      }
    },
  ],
}