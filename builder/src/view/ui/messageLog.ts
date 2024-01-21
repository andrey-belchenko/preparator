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
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";

export const flow: SingleStepFlow = {
  src: __filename,
  comment: "Представление для отображения лога информобмена",
  input: sysCol.sys_MessageLog,
  output: thisCol.view_messageLog,
  operationType: OperationType.view,
  pipeline: new Pipeline()
    .unset("message")
    .addFields({
       _sid:{$toString:"$_id"}
    })
    .build(),
};

// utils.compileFlow(flow)
