import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";

import * as trig from "triggers";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as utils from "_sys/utils";



let flow: SingleStepFlow = {
  trigger: trig.trigger_switchesToRgis,
  input: sysCol.model_Links,
  output: col.out_Rgis,
  useDefaultFilter: false,
  operationType: OperationType.insert,
  pipeline: new Pipeline()
    .match({ predicate: "Switch_LineSpan" })
    .match({
      fromType: {
        $in: ["Disconnector", "Recloser"],
      },
    })
    .entityId("fromId")
    .lookupSelf("s")
    .unwindEntity()
    .matchExpr("$s.model.PowerSystemResource_ccsCode")
    .entityId("toId")
    .lookupSelf("ls")
    .unwindEntity()
    .lookupParent("LineSpan_StartTower", "t")
    .unwindEntity()
    .project({
      queueName: "LINE_SEGMENT.ASTU.IN",
      payload: {
        КодСобытия: "РазделениеУчасткаМагистралиКА",
        ДатаФормированияСообщения: "$$NOW",
        СистемаИсточник: "ЕИП",
        Тело: {
          ЭлементСтруктурыСети: {
            КодТехническогоОбъекта: "$s.model.PowerSystemResource_ccsCode",
            НаименованиеТехнОбъекта: "$s.model.IdentifiedObject_name",
            Опора: {
              КодТехническогоОбъекта: "$t.extId.КИСУР",
            },
          },
        },
      },
       // для отображения в витрине
       objectId:"$s.model.PowerSystemResource_ccsCode",
       objectName: "$s.model.IdentifiedObject_name",
    })
    .build(),
};
export const flows = [flow]
// utils.compileFlow(flow)