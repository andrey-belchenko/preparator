// import {
//   FilterType,
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
// import * as trig from "triggers"

// export const flow: MultiStepFlow = {
//   src: __filename,
//   trigger: trig.trigger_ExtraMatchingApply,
//   operation: [
//     {
//       input: sysCol.sys_model_UnblockedEntities,
//       filterType:FilterType.changedAt,
//       output: sysCol.model_Input,
//       operationType: OperationType.insert,
//       comment: "Запись сопоставленных ключей в модель",
//       pipeline: new Pipeline()
//         .addFields({
//           id: {
//             $arrayToObject: [
//               [
//                 ["$idSource", "$id"],
//                 ["processor", "$id"],
//                 ["platform", "$platformId"],
//               ],
//             ],
//           },
//         })
//         .project({
//           model: {
//             "@type": "$type",
//             "@id": "$id",
//           },
//         })
//         .build(),
//     },
//     {
//       input: sysCol.sys_model_UnblockedEntities,
//       filterType:FilterType.changedAt,
//       output: sysCol.sys_model_ForbiddenEntities,
//       operationType: OperationType.sync,
//       whenMatched: WhenMatchedOperation.merge,
//       comment:
//         "Удаление записей о том, что запрещена обработка объектов, для объектов, по которым появилось сопоставление",
//       pipeline: new Pipeline()
//         .lookup({
//           from: sysCol.sys_model_ForbiddenEntities,
//           localField: "_id",
//           foreignField: "_id",
//           as: "o",
//         })
//         .unwind("$o")
//         .project({
//           _id: "$_id",
//           deletedAt: "$$NOW",
//         })
//         .build(),
//     },
//     {
//       input: sysCol.sys_model_UnblockedDto,
//       filterType:FilterType.changedAt,
//       output: sysCol.sys_MessageInput,
//       operationType: OperationType.sync,
//       comment: "Повторная отправка сообщений по разблокированным dto",
//       pipeline: new Pipeline()
//         .lookup({
//           from: sysCol.sys_model_BlockedMessages,
//           localField: "lastMessageId",
//           foreignField: "_id",
//           as: "m",
//         })
//         .unwind("$m")
//         .replaceRoot("$m.msg")
//         .build(),
//     },
    
//   ],
// };

// // utils.compileFlow(flow.operation[0])
