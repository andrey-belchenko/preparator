import { Flow, OperationType, WhenMatchedOperation } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
// import * as col from "collections";
// import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";
import { MatchingStatus } from "./statuses";

export const flow: Flow = {
  src: __filename,
  input: sysCol.sys_model_BlockedMessages,
  output: thisCol.view_blockedDtoDetails,
  operationType: OperationType.view,
  pipeline: new Pipeline()
    .unwind("$entities")
    .lookup({
      from: sysCol.sys_model_ExtraIdMatching,
      localField: "entities.fullId",
      foreignField: "fullId",
      as: "me",
    })
    .unwind({path:"$me",preserveNullAndEmptyArrays:true})
    .addFields({
      "entities.status": "$me.status",
      "entities.name": {$ifNull:["$entities.name","$me.name"]},
    })
    .group({
      _id: "$id",
      message: { $first: "$msg.payload" },
      entities: { $push: "$entities" },
    })
    .build(),
};
// matchedEntitiesCount
// utils.compileFlow(flow)
