import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as inputCol from "../input/_collections";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: MultiStepFlow = {
  src: __filename,
  operation: [
    {
      input: inputCol.flow_changed_Tower_ext,
      output: thisCol.flow_affected_LineSpan,
      operationType: OperationType.replace,
      comment:
        "Затронутые пролеты: все пролеты связанные с измененными опорами",
      pipeline: new Pipeline()
        .entityId("_id")
        .lookupParent("Tower_AccountPartLine")
        .unwindEntity()
        .lookupParent("AccountPartLine_Line", "l")
        .unwindEntity()
        .matchExpr({ $not: "$l.model.Line_isNotMatched" })
        .entityId("_id")
        .inverseLookupChildrenOfType("LineSpan", "LineSpan_StartTower", "ls1")
        .inverseLookupChildrenOfType("LineSpan", "LineSpan_EndTower", "ls2")
        .project({
          lsId: { $concatArrays: ["$ls1.id", "$ls2.id"] },
        })
        .unwind("$lsId")
        .group({ _id: "$lsId" })
        .entityId("_id")
        .lookupSelf("ls")
        .unwindEntity()
        .project({ _id: "$_id", code: "$ls.extId.КИСУР" })
        .build(),
    },
    {
      input: thisCol.flow_affected_LineSpan,
      output: thisCol.flow_affected_ACLineSegment,
      operationType: OperationType.replace,
      comment:
        "Затронутые сегменты: все сегменты связанные с затронутыми пролетами",
      pipeline: new Pipeline()
        .entityId("_id", "LineSpan")
        .lookupSelf()
        .unwindEntity()
        .lookupParentOfType("ACLineSegment", "LineSpan_ACLineSegment", "s")
        .unwindEntity()
        .group({ _id: "$s.id" })
        .build(),
    },
    {
      input: inputCol.flow_changed_Tower_ext,
      output: thisCol.flow_affected_ACLineSegment,
      operationType: OperationType.sync,
      comment:
        "Затронутые сегменты: дополнительно попадают сегменты по удаленным APL",
      pipeline: new Pipeline()
        .matchExpr("$aclsId")
        .group({ _id: "$aclsId" })
        .entityId("_id")
        .lookupParent("Equipment_EquipmentContainer","l")
        .unwindEntity()
        .matchExpr({ $not: "$l.model.Line_isNotMatched" })
        .project({ _id: "$_id" })
        .build(),
    },
    {
      input: thisCol.flow_affected_LineSpan,
      output: thisCol.flow_affected_LineSpan_ext,
      operationType: OperationType.replace,
      comment:
        "Расширенный список затронутых пролетов: 1 все пролеты связанные с измененными опорами",
      pipeline: [],
    },
    {
      input: thisCol.flow_affected_ACLineSegment,
      output: thisCol.flow_affected_LineSpan_ext,
      operationType: OperationType.sync,
      comment:
        "Расширенный список затронутых пролетов: 2 все пролеты связанные с затронутыми сегментами",
      pipeline: new Pipeline()
        .entityId("_id")
        .inverseLookupChildrenOfType("LineSpan", "LineSpan_ACLineSegment", "ls")
        .unwindEntity()
        .group({ _id: "$ls.id", code: { $first: "$ls.extId.КИСУР" } })
        .build(),
    },
  ],
};
