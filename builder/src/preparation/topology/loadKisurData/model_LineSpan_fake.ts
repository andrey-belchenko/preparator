import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import * as utils from "_sys/utils";
// import * as thisUtils from "./_utils";
import { Pipeline } from "_sys/classes/Pipeline";
import {
  fakeSegment2Pipeline,
  fakeCode,
} from "scenario/003-new/process/_utils";

export const flow: MultiStepFlow = {
  src: __filename,
  trigger: thisCol.KISUR_SubstationLinkSpanTower,
  operation: [
    {
      comment:
        "Создание фиктивных пролетов для создания фиктивных сегментов в случаях, когда оборудование подключено в середину участка по данным КИСУР",
      input: thisCol.KISUR_SubstationLinkSpanTower,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .group({
          _id: "$Пролет",
          item: { $first: "$$ROOT" },
        })
        .replaceRoot("$item")
        .lookup({
          from: "dm_LineSpan",
          localField: "Пролет",
          foreignField: "extId.КИСУР",
          as: "ls",
        })
        .unwind("$ls")
        .matchExpr("$ls.model.LineSpan_EndTower")
        .lookup({
          from: "dm_LineSpan",
          localField: "ls.model.LineSpan_EndTower",
          foreignField: "model.LineSpan_StartTower",
          as: "nls",
        })
        .matchExpr({ $gt: [{ $size: "$nls" }, 0] })
        .matchExpr("$ls.model.LineSpan_StartTower")
        .lookup({
          from: "dm_LineSpan",
          localField: "ls.model.LineSpan_StartTower",
          foreignField: "model.LineSpan_EndTower",
          as: "pls",
        })
        .matchExpr({ $gt: [{ $size: "$pls" }, 0] })
        .project({
          model: {
            "@type": "LineSpan",
            "@action": "create",
            "@id": fakeCode("Пролет", 1),
            "@idSource": "КИСУР",
            "@lastSource": "keep",
            IdentifiedObject_name: "Фиктивный пролет",
            LineSpan_fakeType: { $literal: 1 },
            LineSpan_length: { $literal: 5 },
            LineSpan_AccountPartLine: {
              "@idSource": "platform",
              "@type": "AccountPartLine",
              "@id": "$ls.model.LineSpan_AccountPartLine",
              "@lastSource": "keep",
            },
            IdentifiedObject_ParentObject: {
              "@idSource": "platform",
              "@type": "AccountPartLine",
              "@id": "$ls.model.LineSpan_AccountPartLine",
              "@lastSource": "keep",
            },
            LineSpan_StartTower: {
              "@idSource": "platform",
              "@type": "Tower",
              "@id": "$ls.model.LineSpan_EndTower",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
      comment:
        "Создание фиктивных пролетов для создания фиктивных сегментов в случаях когда КА установлен на опоре где есть отпайка. Добавляется фиктивный пролет, чтобы отпайка и КА были на разных опорах",
      input: sysCol.model_Links,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .match({ predicate: "Switch_LineSpan" })
        .project({
          switchId: "$fromId",
          lineSpanId: "$toId",
        })
        .addStepsFromPipeline(fakeSegment2Pipeline)
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[1]);
