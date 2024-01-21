import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as inputCol from "../input/_collections";
export const flow: Flow = {
  src: __filename,
  input: inputCol.in_РазделениеУчасткаМагистралиКА,
  operationType: OperationType.insert,
  output: col.out_Rgis,
  pipeline: [
    {
      $project: {
        _id: false,
        queueName: "LINE_SEGMENT.ASTU.IN",
        payload: {
          КодСобытия: "РазделениеУчасткаМагистралиКА",
          ДатаФормированияСообщения: "$$NOW",
          СистемаИсточник: "ЕИП",
          Тело: {
            ЭлементСтруктурыСети: {
              КодТехническогоОбъекта:
                "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
              НаименованиеТехнОбъекта:
                "$payload.Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта",
              Опора: {
                КодТехническогоОбъекта:
                  "$payload.Тело.ЭлементСтруктурыСети.Опора.КодТехническогоОбъекта",
              },
            },
          },
        },
        // для отображения в витрине
        objectId: "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
        objectName:
          "$payload.Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта",
      },
    },
  ],
};
