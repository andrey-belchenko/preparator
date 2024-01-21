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
    { $unwind: '$value' },
    { $project: { _id: 0 } },
    { $sort: { changedAt: -1 } },

    // Если оборудование отсутствует в платформе, то такие статусы пишутся в sys_Warning
    {
      $lookup: {
        localField: "value.switchUid",
        from: "model_Entities",
        foreignField: "initialId",
        as: "model_Entities"
      }
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true
      }
    },
    { $match: { model_Entities: { $eq: null } } },
    { $project: 
      { 
        id: {$concat:["switchPlatformUidUnknown_", "$value.switchUid"]},
        message: {$concat:["API СК-11 вернул состояние КА, который отсутствует в платформе. ", "$value.switchUid" ]},
        data :"$value"
      } 
    },
  ],
}