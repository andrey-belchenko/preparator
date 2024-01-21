import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../input/_collections";
import { Expression, Fields, Pipeline } from "_sys/classes/Pipeline";
import { fakeSegment2Pipeline } from "./_utils";
import { pipeline as changedTowerPipeline} from "scenario/003-new/input/common/flow_ChangedTower";
import * as utils from  "_sys/utils";

export const flow: MultiStepFlow = {
  operation: [
    {
      src: __filename,
      input: thisCol.flow_changed_Tower,
      output: thisCol.flow_changed_Tower_ext,
      operationType: OperationType.replace,
      pipeline: [],
    },
    {
      src: __filename,
      comment:
        "Создание фиктивных пролетов для создания фиктивных сегментов в случаях когда КА установлен на опоре где есть отпайка. Добавляется фиктивный пролет, чтобы отпайка и КА были на разных опорах",
      input: thisCol.flow_changed_Tower_ext,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      pipeline: new Pipeline()
        .entityId("_id")
        .inverseLookupChildrenOfType("LineSpan","LineSpan_StartTower", "ls")
        .unwindEntity()
        .lookupChildren("LineSpan_Switches", "s")
        .unwindEntity()
        .project({
          switchId: "$s.id",
          lineSpanId: "$ls.id",
        })
        .addStepsFromPipeline(fakeSegment2Pipeline)
        .build(),
    },
    {
      src: __filename,
      input: col.dm_LineSpan,
      output: thisCol.flow_changed_Tower_ext,
      operationType: OperationType.sync,
      pipeline: changedTowerPipeline,
    }
  ],
};

// utils.compileFlow(flow.operation[1])

// export const flow1: SingleStepFlow = {
//   src: __filename,
//   comment:
//     "Создание фиктивных пролетов для создания фиктивных сегментов в случаях когда КА установлен на опоре где есть отпайка. Добавляется фиктивный пролет, чтобы отпайка и КА были на разных опорах",
//   input: thisCol.flow_changed_Tower,
//   output: sysCol.model_Input,
//   operationType: OperationType.insert,
//   pipeline: new Pipeline()
//     .entityId("_id")
//     .lookupChildren("Tower_Switches", "s")
//     .unwindEntity()
//     .project({
//       switchId: "$s.id",
//       towerId: "$_id",
//     })
//     .addStepsFromPipeline(fakeSegment2Pipeline)
//     .build(),
// };
