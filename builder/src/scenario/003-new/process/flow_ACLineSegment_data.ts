import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { compileFlow } from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_LineSpan_ACLineSegment_new,
  output: thisCol.flow_ACLineSegment_data,
  operationType: OperationType.insert,
  pipeline: new Pipeline()
    .entityId("lineSpanId", "LineSpan")
    .lookupSelf("ls")
    .unwindEntity()
    .group({
      _id: "$aclsId",
      length: { $sum: { $ifNull: ["$ls.model.LineSpan_length", 0] } },
    })
    .build(),
};

// compileFlow(flows[0] as SingleStepFlow)
