import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections"
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.out_rgis_add_all,
  output: sysCol.sys_Warning,
  operationType: OperationType.sync,
  mergeKey:"id",
  pipeline: [
    { $unwind: "$payload.Тело" },
    {
      $match: {
        $or: [
          { "payload.Тело.КодПометки": { $eq: null } },
          { "payload.Тело.КодТехническогоОбъекта": { $eq: null } },
          { "payload.Тело.НаименованиеТехнОбъекта": { $eq: null } },
          { "payload.Тело.ТипТехническогоОбъекта": { $eq: null } },
          {
            $and: [
              { "payload.Тело.КодОборудования": { $exists: true } },
              { "payload.Тело.КодОборудования": { $eq: null } }
            ]
          },
          {
            $and: [
              { "payload.Тело.НаименованиеОборудования": { $exists: true } },
              { "payload.Тело.НаименованиеОборудования": { $eq: null } }
            ]
          },
          {
            $and: [
              { "payload.Тело.ТипОборудования": { $exists: true } },
              { "payload.Тело.ТипОборудования": { $eq: null } }
            ]
          }
        ]
      }
    },
    {
      $project:
      {
        id: { $concat: ["marksPlatformMissingValue_", "$payload.Тело.КодПометки"] },
        message:
        {
          $switch: {
            branches: [
              {
                case: { $eq: ["$payload.Тело.КодПометки", null] },
                then: { $concat: ["В Платформе отсутствует КодПометки для пометки."] }
              },
              {
                case: { $eq: ["$payload.Тело.КодТехническогоОбъекта", null] },
                then: { $concat: ["В Платформе отсутствует КодТехническогоОбъекта для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
              {
                case: { $eq: ["$payload.Тело.НаименованиеТехнОбъекта", null] },
                then: { $concat: ["В Платформе отсутствует НаименованиеТехнОбъекта для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
              {
                case: { $eq: ["$payload.Тело.ТипТехническогоОбъекта", null] },
                then: { $concat: ["В Платформе отсутствует ТипТехническогоОбъекта для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
              {
                case: { $eq: ["$payload.Тело.КодОборудования", null] },
                then: { $concat: ["В Платформе отсутствует КодОборудования для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
              {
                case: { $eq: ["$payload.Тело.НаименованиеОборудования", null] },
                then: { $concat: ["В Платформе отсутствует НаименованиеОборудования для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
              {
                case: { $eq: ["$payload.Тело.ТипОборудования", null] },
                then: { $concat: ["В Платформе отсутствует ТипОборудования для пометки. Uid пометки: ", "$payload.Тело.КодПометки"] }
              },
            ], default: '$null'
          }
        },
        data: "$payload.Тело"
      }
    }
  ],
};
