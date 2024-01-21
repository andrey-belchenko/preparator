import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
export const flow: Flow = {
  src: __filename,
  input: "dm_ACLineSegment",
  operationType: OperationType.insert,
  output: col.out_Rgis,
  pipeline: [
    { $match: { $expr: "$deletedAt" } },
    {
      $project: {
        _id: false,
        queueName: "LINE_SEGMENT.ASTU.IN",
        payload: {
          КодСобытия: "УдалениеСегмента",
          ДатаФормированияСообщения: "$$NOW",
          СистемаИсточник: "ЕИП",
          Тело: {
            ЭлементСтруктурыСети: {
              mRID: "$initialId",
            },
          },
        },
        // для отображения в витрине
        objectId:"$initialId",
        objectName: "$model.IdentifiedObject_name",
      },
    },
  ],
};
