import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
export const flow: SingleStepFlow = {
  src: __filename,
  input: "dm_ACLineSegment",
  operationType: OperationType.insert,
  output: col.out_Rgis,
  pipeline: [
    // lookup с пайплайном (подтягиваем эелементы из другой колекции и сразу обрабатываем их)
    {
      $lookup:
      {
        from: "dm_LineSpan",
        let: { segmentId: "$id" },
        pipeline: [
          {
            $match:
            {
              $expr:
                { $eq: ["$model.LineSpan_ACLineSegment", "$$segmentId"] }
            }
          },
          // исключаем из сообщения фиктивные сегменты
          { $match: { "model.LineSpan_fakeType": { $exists: false } } } ,
          {
            $project:
            {
              "_id": false,
              "КодТехническогоОбъекта": "$extId.КИСУР",
              "НаименованиеТехнОбъекта": "$model.IdentifiedObject_name"
            }
          },
        ],
        as: "пролеты"
      }
    },
    // не формируем сообщение, если пролеты отсутствуют в БД
    { $match: { $expr: { $not: { $eq: [{ $size: "$пролеты" }, 0] } } } },

    // простой lookup (подтягиваем эелементы из другой колекции в виде масива) ЛЭП:[{id:"111","name":"AAAA"}]
    {
      $lookup: {
        from: "dm_Line",
        localField: "model.IdentifiedObject_ParentObject",
        foreignField: "id",
        as: "ЛЭП"
      }
    },
    // превращаем массив полученный выше в единичный объект ЛЭП:{id:"111","name":"AAAA"}
    // так можно делать если знаем что в масиве один элемент, иначе все содержимое на текущем шаге будет повторено столько раз сколько элементов в массиве
    { $unwind: "$ЛЭП" },
    {

      $project: {
        "_id": false,
        "queueName": "LINE_SEGMENT.ASTU.IN",
        "payload": {
          "КодСобытия": "СозданиеСегмента",
          "ДатаФормированияСообщения": "$$NOW",
          "СистемаИсточник": "ЕИП",
          "Тело": {
            "ЭлементСтруктурыСети": {
              "mRID": "$initialId",
              // "КодТехническогоОбъекта": "$id",
              "НаименованиеТехнОбъекта": "$model.IdentifiedObject_name",
              "ТипТехнОбъекта": "ACLineSegment",
              "Пролеты": "$пролеты",
              "ЛЭП": {
                "КодТехническогоОбъекта": "$ЛЭП.extId.КИСУР",
                "Наименование": "$ЛЭП.model.IdentifiedObject_name"
              }
            }
          }
        },
        // для отображения в витрине
       objectId:"$initialId",
       objectName: "$model.IdentifiedObject_name",
      }
    }
  ],
};

