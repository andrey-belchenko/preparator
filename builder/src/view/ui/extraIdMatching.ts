import {
  FilterType,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
  WhenMatchedOperation,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
// import * as col from "collections";
// import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
// import * as thisCol from "./collections";
import * as trig from "triggers";
import { MatchingStatus } from "./statuses";
export const flows: SingleStepFlow[] = [
  {
    src: __filename,
    input: sysCol.sys_model_BlockedEntities,
    output: sysCol.sys_model_ExtraIdMatching,
    operationType: OperationType.sync,
    whenMatched: WhenMatchedOperation.merge,
    pipeline: new Pipeline()
      .lookup({
        from: sysCol.sys_model_ExtraIdMatching,
        localField: "id",
        foreignField: "fullId",
        as: "a",
      })
      .unwind("$a")
      .group({
        _id: "$a._id",
        lastBlocked: { $max: "$changedAt" },
        type: { $max: { $ifNull: ["$type", "$a.type"] } },
        name: { $max: { $ifNull: ["$name", "$a.name"] } },
      })
      .build(),
  },
  {
    src: __filename,
    trigger: trig.trigger_IdMatching,
    input: sysCol.sys_model_ExtraIdMatching,
    output: sysCol.sys_model_ExtraIdMatching,
    operationType: OperationType.sync,
    whenMatched: WhenMatchedOperation.merge,
    filterType: FilterType.changedAt,
    pipeline: new Pipeline()
      .lookup({
        from: sysCol.model_Entities,
        localField: "platformId",
        foreignField: "id",
        as: "a",
      })
      .unwind({ path: "$a", preserveNullAndEmptyArrays: true })
      .addFields({
        platformId: {
          $cond: [{ $eq: ["$platformId", ""] }, null, "$platformId"],
        },
      })
      .addFields({
        pid: {
          $ifNull: ["$platformId", "ec017f9a-c859-43fa-a0c1-7a3901a2b078"],
        },
      })
      .lookup({
        from: sysCol.sys_model_ExtraIdMatching,
        localField: "pid",
        foreignField: "platformId",
        as: "b",
      })
      .project({
        _id: "$_id",
        platformName: { $ifNull: ["$a.model.IdentifiedObject_name", null] },
        status: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$status", MatchingStatus.processed] },
                then: MatchingStatus.processed,
              },
              {
                case: "$allowCreate",
                then: MatchingStatus.ready,
              },
              {
                case: { $not: "$platformId" },
                then: MatchingStatus.notMatched,
              },
              {
                case: { $gt: [{ $size: "$b" }, 1] },
                then: MatchingStatus.duplicate,
              },
              {
                case: { $not: "$a.id" },
                then: MatchingStatus.notFound,
              },
              {
                case: {
                  $and: ["$a.type", "$type", { $ne: ["$a.type", "$type"] }],
                },
                then: MatchingStatus.incorrectType,
              },
            ],
            default: MatchingStatus.ready,
          },
        },
      })

      .build(),
  },
];

// utils.compileFlow(flow)
