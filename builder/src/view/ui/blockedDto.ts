import { Flow, OperationType, WhenMatchedOperation } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
// import * as col from "collections";
// import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";
import { MatchingStatus, BlockedMessageStatus } from "./statuses";

export const flows: Flow[] = [
  {
    src: __filename,
    input: sysCol.sys_model_BlockedDto,
    output: thisCol.view_blockedDtoToUpdate,
    operationType: OperationType.sync,
    whenMatched: WhenMatchedOperation.merge,
    pipeline: new Pipeline()
      .project({
        _id: "$_id",
        lastMessageId: "$lastMessageId",
      })
      .build(),
  },
  {
    src: __filename,
    input: sysCol.sys_model_ExtraIdMatching,
    output: thisCol.view_blockedDtoToUpdate,
    operationType: OperationType.sync,
    whenMatched: WhenMatchedOperation.merge,
    pipeline: new Pipeline()
      .lookup({
        from: sysCol.sys_model_BlockedDtoEntities,
        localField: "fullId",
        foreignField: "entityId",
        as: "de",
      })
      .lookup({
        from: sysCol.sys_model_BlockedDto,
        localField: "de.dtoId",
        foreignField: "id",
        as: "d",
      })
      .unwind("$d")
      .group({
        _id: "$d._id",
      })
      .build(),
  },
  {
    src: __filename,
    input: thisCol.view_blockedDtoToUpdate,
    output: thisCol.view_blockedDto,
    operationType: OperationType.sync,
    whenMatched: WhenMatchedOperation.merge,
    pipeline: new Pipeline()
      .lookup({
        from: sysCol.sys_model_BlockedDto,
        localField: "_id",
        foreignField: "_id",
        as: "d",
      })
      .unwind("$d")
      .lookup({
        from: sysCol.sys_model_BlockedMessages,
        localField: "lastMessageId",
        foreignField: "_id",
        as: "m",
      })
      .unwind("$m")

      .lookup({
        from: sysCol.sys_model_ExtraIdMatching,
        localField: "m.entities.fullId",
        foreignField: "fullId",
        as: "e",
      })
      .addFields({
        me: {
          $filter: {
            input: "$e",
            as: "it",
            cond: {
              $in: [
                "$$it.status",
                [MatchingStatus.ready, MatchingStatus.processed],
              ],
            },
          },
        },
      })
      // .replaceRoot("$m")
      .project({
        _id: "$_id",
        idSource: "$m.idSource",
        eventId: "$m.msg.eventId",
        objectId: "$m.msg.objectId",
        messageChangedAt: "$m.msg.changedAt",
        // messageExtId: "$m.msg.payload.ИдСообщения",
        blockedMessageId: "$m.id",
        blockedEntitiesCount: { $size: "$m.entities" },
        matchedEntitiesCount: { $size: "$me" },
        applyOperationId: "$d.applyOperationId",
        processedAt:"$d.processedAt"
      })
      .addFields({
        status: {
          $switch: {
            branches: [
              {
                case: "$processedAt",
                then: BlockedMessageStatus.processed,
              },
              {
                case: {
                  $eq: ["$blockedEntitiesCount", "$matchedEntitiesCount"],
                },
                then: BlockedMessageStatus.ready,
              },
            ],
            default: BlockedMessageStatus.needMatch,
          },
        },
      })
      .build(),
  },
];
// matchedEntitiesCount
// utils.compileFlow(flow)
