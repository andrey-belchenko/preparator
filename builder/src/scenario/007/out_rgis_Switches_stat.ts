import { Flow } from "_sys/classes/Flow";
import * as col from "collections";
import * as sysCol from "_sys/collections";

export const flow: Flow = {
  src: __filename,
  input: col.dm_DiscreteValue,
  output: col.out_Rgis,
  idSource: "platform",
  pipeline: [
    {
      $lookup: {
        localField: "model.MeasurementValue_measurementValueQuality",
        from: "dm_MeasurementValueQuality",
        foreignField: "id",
        as: "dm_MeasurementValueQuality"
      }
    },
    {
      $unwind: {
        path: "$dm_MeasurementValueQuality",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        localField: "dm_MeasurementValueQuality.model.Quality61850_validity",
        from: "dm_Validity",
        foreignField: "id",
        as: "Validity"
      }
    },
    {
      $unwind: {
        path: "$Validity",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields:
      {
        substr_uid: { $substr: ["$extId.processor", 13, 36] }

      },
    },
    {
      $lookup: {
        localField: "substr_uid",
        from: "model_Entities",
        foreignField: "id",
        as: "model_Entities"
      }
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true
      }
    },

    // не отправляем сообщение в РГИС если КА не сопоставлен   
    {
      $match: {
        $and: [
          { "model_Entities.model.PowerSystemResource_ccsCode": { $exists: true } },
          { "model_Entities.model.PowerSystemResource_ccsCode": { $ne: null }},
          { "model_Entities.model.PowerSystemResource_ccsCode": { $ne: "" }}
          ]
      }
    },
    {
      $group:
      {
        _id: {
          КодСобытия: "ОбновлениеПоложенияКА",
          ДатаФормированияСообщения: "$$NOW",
          СистемаИсточник: "ЕИП"
        },
        Тело: {
          $push:
          {
            КодТехническогоОбъекта: { $ifNull: ["$model_Entities.model.PowerSystemResource_ccsCode", null] },
            ЗначениеИзмеренияСостояния: { $ifNull: ["$model.DiscreteValue_value", null] },
            ОбобщённыйКодКачестваТелеизмерения: { $ifNull: ["$Validity.model.Validity_label", null] },
            Время: "$model.MeasurementValue_timeStamp",
          },
        },
      },
    },
    {
      $project: {
        _id: false,
        queueName: "SWITCH_STAT.ASTU.IN",
        payload: {
          ИдСообщения: "$_id.ИдСообщения",
          КодСобытия: "$_id.КодСобытия",
          ДатаФормированияСообщения: "$_id.ДатаФормированияСообщения",
          СистемаИсточник: "$_id.СистемаИсточник",
          Тело: "$Тело"
        }, 
      }
    },
  ],
};