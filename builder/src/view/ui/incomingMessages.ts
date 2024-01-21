import {
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Expression, Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";
import {
  validRegionExpr,
  isValidSupplyCenterSteps,
} from "scenario/common/_utils";

export const flow: SingleStepFlow = {
  src: __filename,
  comment: "Представление для отображения входящих сообщений",
  input: sysCol.sys_IncomingMessages,
  output: thisCol.view_incomingMessages,
  operationType: OperationType.insert,
  pipeline: new Pipeline()
    .lookup({
      from: sysCol.sys_model_BlockedMessages,
      let: {
        id: "$messageId",
      },
      pipeline: new Pipeline()
        .matchExpr({ $eq: ["$id", "$$id"] })
        .project({
          isBlocked: { $literal: true },
        })
        .build(),
      as: "blocked",
    })
    .unwind({ path: "$blocked", preserveNullAndEmptyArrays: true })
    // .lookup({
    //   localField: "messageId",
    //   foreignField: "messageId",
    //   from: sysCol.sys_MessageIssues,
    //   as: "i",
    // })
    // .unwind({ path: "$i", preserveNullAndEmptyArrays: true })
    .addSteps(isValidSupplyCenterSteps())
    .addFields({
      // status: { $cond: ["$blocked.isBlocked", "Отложено", "Принято"] },
      // code: { $ifNull: ["$payload.body.code", "$payload.body.element.code"] },
      status: {
        $switch: {
          branches: [
            { case: "$issue", then: { $concat: ["Пропущено: ", "$issue"] } },
            { case: "$blocked.isBlocked", then: "Отложено" },
            {
              case: { $not: validRegionExpr },
              then: "Пропущено: Исключенный РЭС",
            },
            {
              case: { $not: "$isValidSupplyCenter" },
              then: "Пропущено: Исключенный питающий центр",
            },
          ],
          default: "Принято",
        },
      },
    })
    .build(),
};

// utils.compileFlow(flow)
