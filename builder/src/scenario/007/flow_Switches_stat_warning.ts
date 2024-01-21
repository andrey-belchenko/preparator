import { info } from "console";
import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections"
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.in_Switches,
  output: sysCol.sys_Warning,
  operationType: OperationType.sync,
  mergeKey:"id",
  pipeline: [
    { $sort: { changedAt: -1 } },
    {
      $group: {
        _id: null,
        item: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$item" } },
    { $unwind: '$value' },
    { $project: { _id: 0 } },
    {
      $match: {
        "$expr": {
          $gt: ["$value.error", null]
        }
      }
    },
    { $project: 
      { 
        id: {$concat:["switchStatusApiError_","$value.switchUid"]},
        message: {$concat:["API СК-11 вернул ошибку при запросе состояния КА ","$value.switchUid"]},
        data: {"error": "$value.error"}
      } 
    },
  ],
}