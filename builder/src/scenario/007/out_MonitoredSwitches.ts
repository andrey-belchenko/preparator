import { OperationType, SingleStepFlow } from "_sys/classes/Flow";
import { Pipeline } from "_sys/classes/Pipeline";
import * as col from "collections";

export const flow: SingleStepFlow = {
  src: __filename,
  input: col.model_Links,
  operationType: OperationType.sync,
  output: col.out_MonitoredSwitches,
  pipeline: new Pipeline()
    .match({ toType: "Line" })
    .match({
      fromType: {
        $in: [
          /* На текущий момент РГИС отображает только Disconnector и Recloser. */
          /* Опрос остальных типов КА можно добавить раскомментировав соответствующий тип.  */
          "Disconnector",
          "Recloser",
          // "Breaker",
          // "Cut",
          // "Fuse",
          // "FuseSwitchDisconnector",
          // "GroundDisconnector",
          // "Jumper",
          // "KnifeSwitch",
          // "LoadBreakSwitch",
          // "Sectionaliser",
          // "ThyristorSwitch"
        ],
      },
    })
    .match({ predicate: "Equipment_EquipmentContainer" })
    .entityId("fromId")
    .lookupSelf("s")
    .unwindEntity()
    //берем только сопоставленные
    .matchExpr({ $ifNull: ["$s.extId.processor", "$s.extId.КИСУР"] })
    .project({
      _id: "$fromId",
    })
    .build(),
};
