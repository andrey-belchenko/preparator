import {
  Flow,
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

export const flow: Flow = {
  src: __filename,
  comment: "Оборудование и контейнеры",
  input: thisCol.view_objectTreeWithStat,
  output: thisCol.view_objectTable,
  operationType: OperationType.view,
  pipeline: new Pipeline()
  .matchExpr("$rcType")
  .build(),
};

// utils.compileFlow(flow.operation[0])
