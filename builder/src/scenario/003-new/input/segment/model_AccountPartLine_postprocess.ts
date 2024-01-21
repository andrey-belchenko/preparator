import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import { Pipeline } from "_sys/classes/Pipeline";

export const flows: Flow[] = [
  {
    isParallel: false,
    operation: [
      {
        isParallel: true,
        operation: [
          createFlow("StartTower", "EndTower", "isFromSubstation"),
          createFlow("EndTower", "StartTower", "isToSubstation"),
        ],
      },
    ],
  },
];

// import * as utils from "_sys/utils";

// utils.compileFlow(flow)
function createFlow(
  localField: string,
  foreignField: string,
  targetField: string
): SingleStepFlow {
  let model: any = {
    "@type": "LineSpan",
    "@action": "update",
    "@id": "$ls.id",
    "@idSource": "platform",
  };
  model["LineSpan_" + targetField] = "$model.AccountPartLine_" + targetField;
  return {
    src: __filename,
    comment: "Копирование признаков isFromSubstation, isToSubstation с AccountPartLine на LineSpan",
    input: col.dm_AccountPartLine,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    pipeline: new Pipeline()
      .entityId("id")
      .inverseLookupChildrenOfType("LineSpan", "LineSpan_AccountPartLine", "ls")
      .unwindEntity()
      .addFields({
        towerId: { $ifNull: ["$ls.model.LineSpan_" + localField, "-"] },
      })
      .lookup({
        from: col.dm_LineSpan,
        localField: "towerId",
        foreignField: "model.LineSpan_" + foreignField,
        as: "ols",
      })
      .unwind({ path: "$ols", preserveNullAndEmptyArrays: true })
      .matchExpr({
        $ne: [
          "$ls.model.LineSpan_AccountPartLine",
          { $ifNull: ["$ols.model.LineSpan_AccountPartLine", "-"] },
        ],
      })
      .project({
        model: model,
      })
      .build(),
  };
}
