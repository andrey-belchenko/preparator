import { Flow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.flow_Switches_stat_new,
  output: col.flow_Switches_stat_updated,
  operationType: OperationType.replace,
  useDefaultFilter: false,

  // выводим записи которые были обновлены 
  // берем запись из flow_Switches_stat_new, если ее значения не совпадают со значениями из flow_Switches_stat_last
  pipeline: [
    {
      $lookup: {
        localField: "value.switchUid",
        from: "flow_Switches_stat_last",
        foreignField: "value.switchUid",
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
      $match:
      {
        "$or": [
          {
            "$expr": {
              "$ne": ["$new.value.value.value", "$value.value.value"]
            }
          },
          {
            "$expr": {
              "$ne": ["$new.value.value.validity", "$value.value.validity"]
            }
          }],
      }
    },
    {
      $project: {
        value: true
      }
    }
  ],
}