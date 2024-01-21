import { Flow } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.dm_Marker,
  output: col.out_Rgis,
  idSource: "platform",
  pipeline: [
    {
      $match:
        { id: { $regex: "deleted" } }
    },
    {
      $group:
      {
        _id: {
          КодСобытия: "УдалениеДиспетчерскойПометки",
          ДатаФормированияСообщения: "$$NOW",
          СистемаИсточник: "ЕИП"
        },
        Тело: {
          $push:
          {
            КодПометки: "$initialId",
          }
        }
      }
    },
    {
      $project: {
        _id: false,
        queueName: "DISPATCHER_TAG.ASTU.IN",
        payload: {
          ИдСообщения: "$_id.ИдСообщения",
          КодСобытия: "$_id.КодСобытия",
          ДатаФормированияСообщения: "$_id.ДатаФормированияСообщения",
          СистемаИсточник: "$_id.СистемаИсточник",
          Тело: "$Тело"
        }
      }
    }
  ],
};