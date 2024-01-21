import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";

import { compileFlow, compileObject } from "_sys/utils";

import { finalPipelineSteps } from "scenario/004/out_Rgis";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_lineStatusBuffer,
  output: col.out_Rgis,
  operationType: OperationType.insert,
  pipeline: [
    ...finalPipelineSteps(),
  ],
};

// utils.compileFlow(flow);
