// import {
//   Flow,
//   MultiStepFlow,
//   OperationType,
//   WhenMatchedOperation,
// } from "_sys/classes/Flow";
// import * as col from "collections";
// import * as sysCol from "_sys/collections";
// import * as difOutput from "_sys/flows/diffOutput";
// import { Pipeline } from "_sys/classes/Pipeline";
// import * as utils from "_sys/utils";

// export const flow: MultiStepFlow = {
//   src: __filename,
//   trigger: sysCol.sys_model_ExtraIdMatching,
//   operation: [
//     {
//       input: sysCol.sys_model_ExtraIdMatching,
//       output: sysCol.sys_model_UnblockedEntities,
//       operationType: OperationType.sync,
//       comment: "Список разблокированных сущностей",
//       pipeline: new Pipeline()
//         .lookup({
//           from: sysCol.sys_model_BlockedEntities,
//           localField: "_id",
//           foreignField: "_id",
//           as: "o",
//         })
//         .unwind("$o")
//         .addFields({
//           "o.platformId": "$platformId",
//         })
//         .replaceRoot("$o")
//         .build(),
//     },
//     {
//       input: sysCol.sys_model_UnblockedEntities,
//       output: sysCol.sys_model_UnblockedDtoEntities,
//       operationType: OperationType.sync,
//       comment: "Список разблокированных сущностей с привязкой к dto",
//       pipeline: new Pipeline()
//         .lookup({
//           from: sysCol.sys_model_BlockedDtoEntities,
//           localField: "_id",
//           foreignField: "entityId",
//           as: "o",
//         })
//         .unwind("$o")
//         .replaceRoot("$o")
//         .build(),
//     },
//     {
//       input: sysCol.sys_model_UnblockedDtoEntities,
//       output: sysCol.sys_model_UnblockedDto,
//       operationType: OperationType.sync,
//       comment: "Список разблокированных dto",
//       pipeline: new Pipeline()
//         .group({
//           _id: "$dtoId",
//         })
//         .lookup({
//           from: sysCol.sys_model_BlockedDtoEntities,
//           localField: "_id",
//           foreignField: "dtoId",
//           as: "be",
//         })
//         .unwind("$be")
//         .lookup({
//           from: sysCol.sys_model_UnblockedDtoEntities,
//           localField: "be._id",
//           foreignField: "_id",
//           as: "ue",
//         })
//         .unwind({ path: "$ue", preserveNullAndEmptyArrays: true })
//         .addFields({
//           blockedFlag: { $cond: ["$ue._id", 0, 1] },
//         })
//         .group({
//           _id: "$_id",
//           blockedCount: { $sum: "$blockedFlag" },
//         })
//         .matchExpr({ $eq: ["$blockedCount", 0] })
//         .lookup({
//           from: sysCol.sys_model_BlockedDto,
//           localField: "_id",
//           foreignField: "_id",
//           as: "o",
//         })
//         .unwind("$o")
//         .replaceRoot("$o")
//         .build(),
//     },
//   ],
// };

// // utils.compileFlow(flow.operation[0])
