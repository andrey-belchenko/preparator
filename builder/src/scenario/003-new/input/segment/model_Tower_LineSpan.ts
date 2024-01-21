import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import * as col from "collections";
import * as flow_ChangedTower from "../common/flow_ChangedTower";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
export const flow: Flow = {
  src: __filename,
  operation: [
    {
      input: thisCol.flow_Сегмент,
      output: thisCol.flow_Сегмент_Связи,
      pipeline: new Pipeline()
        .project({
          item: "$payload.Тело.ЭлементСтруктурыСети.Соединения",
        })
        .unwind("$item")
        .replaceRoot("$item")
        .build(),
    },
    {
      input: thisCol.flow_Сегмент_Связи,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      idSource: "КИСУР",
      pipeline: new Pipeline()
        .lookup({
          localField: "Соединение от",
          from: col.dm_LineSpan,
          foreignField: "extId.КИСУР",
          as: "ls1",
        })
        .lookup({
          localField: "Соединение к",
          from: col.dm_LineSpan,
          foreignField: "extId.КИСУР",
          as: "ls2",
        })
        .addFields({
          isFromLs: { $gt: [{ $size: "$ls1" }, 0] },
          isToLs: { $gt: [{ $size: "$ls2" }, 0] },
        })
        .lookup({
          localField: "Соединение от",
          from: thisCol.flow_Сегмент_Связи,
          foreignField: "Соединение к",
          as: "prev",
        })
        .unwind({ path: "$prev", preserveNullAndEmptyArrays: true })
        .addFields({
          fromLs: {
            $cond: ["$isFromLs", "$Соединение от", "$prev.Соединение от"],
          },
        })
        .matchExpr({ $and: ["$fromLs", { $ne: ["$fromLs", ""] }] })
        .matchExpr("$isToLs")
        .matchExpr({ $ne: ["$Соединяющий объект", ""] })
        .project({
          model: {
            "@type": "Tower",
            "@id": "$Соединяющий объект",
            Tower_StartTower: {
              "@type": "LineSpan",
              "@id": "$Соединение к",
            },
            Tower_EndTower: {
              "@type": "LineSpan",
              "@id": "$fromLs",
            },
          },
        })
        .build(),
    },
  ],
};

// utils.compileFlows(flow.operation.slice(0, 2));
