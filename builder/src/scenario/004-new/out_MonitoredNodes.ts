import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: SingleStepFlow = {
  src: __filename,
  input: col.dm_Line,
  output: thisCol.out_MonitoredNodes,
  operationType: OperationType.sync,
  pipeline: new Pipeline()
    .entityId("id")
    .inverseLookupChildrenOfType(
      "ACLineSegment",
      "Equipment_EquipmentContainer"
    )
    .unwindEntity()
    .inverseLookupChildrenOfType("LineSpan", "LineSpan_ACLineSegment", "ls")
    // берем только сопоставленные с пролетами
    // .matchExpr({ $gt: [{ $size: "$ls" }, 0] })
    .inverseLookupChildrenOfType(
      "Terminal",
      "Terminal_ConductingEquipment",
      "t"
    )
    .unwindEntity()
    .matchExpr("$t.model.Terminal_ConnectivityNode")
    .group({ _id: "$t.model.Terminal_ConnectivityNode" })
    .build(),
};

// utils.compileFlow(flow);
