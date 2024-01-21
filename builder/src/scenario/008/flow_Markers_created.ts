import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Markers_new,
  output: col.flow_Markers_created,
  operationType: OperationType.replace,

  // выводим записи которые были добавлены (отсутствуют в flow_Markers_last)
  pipeline: [
    {
      $lookup: {
        localField: "value.uid",
        from: "flow_Markers_last",
        foreignField: "value.uid",
        as: "last"
      }
    },
    {
      $unwind: {
        path: "$last",
        preserveNullAndEmptyArrays: true
      }
    },
    // Пользователь СК-11 может менять комментарий у существующей пометки. 
    // Переписываем пометку, если поле lastModifiedDateTime изменилось.
    {
      $match: {
        $or: [
          { "last.value.uid": null },
          {
            $and: [
                { $expr: {$eq: ["$last.value.uid", "$value.uid"] }},
                { $expr: {$ne: ["$last.value.lastModifiedDateTime", "$value.lastModifiedDateTime"] }},
            ]
          }
        ]
      }
    },
    {
      $project: {
        value: true
      }
    }
  ],
}