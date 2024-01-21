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
import { Expression, Pipeline } from "_sys/classes/Pipeline";

function hasItems(cond: Expression) {
  return {
    $gt: [
      {
        $size: { $filter: { input: "$sl", as: "it", cond: cond } },
      },
      0,
    ],
  };
}
export const flow: SingleStepFlow = {
  src: __filename,
  comment: "Формирование данных по LineSpan для загрузки в интеграционную БД",
  input: thisCol.KISUR_LineSpan,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,
  pipeline: new Pipeline()
    .entityExtId("КодУчастка", "КИСУР", "AccountPartLine")
    .lookupSelf()
    .unwindEntity()
    .lookup({
      from: thisCol.KISUR_SubstationLinkSpanTower,
      localField: "КодПролета",
      foreignField: "Пролет",
      as: "sl",
    })
    .project({
      model: {
        "@type": "LineSpan",
        "@action": "create",
        "@id": "$КодПролета",
        "@idSource": "КИСУР",
        "@lastSource": "keep",
        IdentifiedObject_name: "$Наименование",
        LineSpan_AccountPartLine: {
          "@idSource": "КИСУР",
          "@type": "AccountPartLine",
          "@id": "$КодУчастка",
          "@lastSource": "keep",
        },
        IdentifiedObject_ParentObject: {
          "@idSource": "КИСУР",
          "@type": "AccountPartLine",
          "@id": "$КодУчастка",
          "@lastSource": "keep",
        },
        LineSpan_aWireTypeName: "$ФазаА",
        LineSpan_bWireTypeName: "$ФазаB",
        LineSpan_cWireTypeName: "$ФазаC",
        LineSpan_isFromSubstation: hasItems({ $not: "$$it.Опора" }),
        LineSpan_isToSubstation: hasItems("$$it.Опора"),
        LineSpan_length: "$ДлиннаПролета",
      },
    })
    .build(),
};
