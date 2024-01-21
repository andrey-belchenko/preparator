import { info } from "console";
import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections"
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.dm_DiscreteValue,
  output: sysCol.sys_Warning,
  operationType: OperationType.sync,
  mergeKey: "id",
  pipeline: [
    {
      $addFields:
      {
        substr_uid: { $substr: ["$extId.processor", 13, 36] }
      },
    },

    // в проверку идут только КА линий
    {
      $lookup: {
        localField: "substr_uid",
        from: "out_MonitoredSwitches",
        foreignField: "_id",
        as: "MonitoredSwitches"
      }
    },
    {
      $match: { $expr: { $ne: [{ $size: "$MonitoredSwitches" }, 0] } },
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
        $or: [
          { "model_Entities.model.PowerSystemResource_ccsCode": { $exists: false } },
          { "model_Entities.model.PowerSystemResource_ccsCode": { $eq: null }},
          { "model_Entities.model.PowerSystemResource_ccsCode": { $eq: "" }}
          ]
      }
    },
    {
      $project:
      {
        id: { $concat: ["switchPlatformSAPUnknown_", "$substr_uid"] },
        message: { $concat: ["В платформе отсутсвутет сопоставление для КА. UID КА:", "$substr_uid"] },
        data: {"UID": "$substr_uid"}
      }
    },
  ],
}
