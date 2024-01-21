import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Markers_last,
  output: col.flow_Markers_deleted,
  operationType: OperationType.replace,
  useDefaultFilter: false,

  // выводим записи которые были удалены (отсутствуют в flow_Markers_new)
  pipeline: [
    {
      $lookup: {
        localField: "value.uid",
        from: "flow_Markers_new",
        foreignField: "value.uid",
        as: "new"
      }
    },
    {
      $unwind: {
        path: "$new",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        "new.value.uid": null
      }
    },
    {
      $project: {
        value: true
      }
    }
  ],
}