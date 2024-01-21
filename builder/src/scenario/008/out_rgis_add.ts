import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.out_rgis_add_all,
  output: col.out_Rgis,
  idSource: "platform",
  pipeline: [
    { $unwind: "$payload.Тело" },
    {
      $match: {
        $and: [
          { "payload.Тело.КодПометки": { $ne: null } },
          { "payload.Тело.КодТехническогоОбъекта": { $ne: null } },
          { "payload.Тело.НаименованиеТехнОбъекта": { $ne: null } },
          { "payload.Тело.ТипТехническогоОбъекта": { $ne: null } },
          {
            $or: [
              { "payload.Тело.КодОборудования": { $exists: false } },
              {
                $and: [
                  { "payload.Тело.КодОборудования": { $exists: true } },
                  { "payload.Тело.КодОборудования": { $ne: null } }
                ]
              }
            ]
          },
          {
            $or: [
              { "payload.Тело.НаименованиеОборудования": { $exists: false } },
              {
                $and: [
                  { "payload.Тело.НаименованиеОборудования": { $exists: true } },
                  { "payload.Тело.НаименованиеОборудования": { $ne: null } }
                ]
              }
            ]
          },
          {
            $or: [
              { "payload.Тело.ТипОборудования": { $exists: false } },
              {
                $and: [
                  { "payload.Тело.ТипОборудования": { $exists: true } },
                  { "payload.Тело.ТипОборудования": { $ne: null } }
                ]
              }
            ]
          }
        ]
      }
    },

    {
      $group:
      {
        _id: {
          queueName: "$queueName",
          payload: {
            КодСобытия: "$payload.КодСобытия",
            ДатаФормированияСообщения: "$payload.ДатаФормированияСообщения",
            СистемаИсточник: "$payload.СистемаИсточник",
          }
        },
        Тело: { $push: "$payload.Тело" }
      }
    },

    {
      $addFields: {
        "_id.payload.Тело": "$Тело",
        "Тело": "$$REMOVE"
      }
    },
    { $replaceRoot: { newRoot: "$_id" } },
  ],
};

