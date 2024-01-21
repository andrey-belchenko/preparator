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
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: MultiStepFlow = {
  src: __filename,
  comment: "Формирование данных по Tower для загрузки в интеграционную БД",
  trigger: thisCol.KISUR_LinkSpanTower,
  operation: [
    {
      input: thisCol.KISUR_LinkSpanTower,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .entityExtId("КодПролетаОт", "КИСУР", "LineSpan")
        .lookupSelf()
        .unwindEntity()
        .matchExpr("$КодОпоры")
        .project({
          model: {
            "@type": "LineSpan",
            "@id": "$КодПролетаОт",
            "@idSource": "КИСУР",
            "@lastSource": "keep",
            LineSpan_EndTower: {
              "@idSource": "КИСУР",
              "@type": "Tower",
              "@id": "$КодОпоры",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
    {
      input: thisCol.KISUR_LinkSpanTower,
      output: sysCol.model_Input,
      operationType: OperationType.insert,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        .entityExtId("КодПролетаК", "КИСУР", "LineSpan")
        .lookupSelf()
        .unwindEntity()
        .matchExpr("$КодОпоры")
        .project({
          model: {
            "@type": "LineSpan",
            "@id": "$КодПролетаК",
            "@idSource": "КИСУР",
            "@lastSource": "keep",
            LineSpan_StartTower: {
              "@idSource": "КИСУР",
              "@type": "Tower",
              "@id": "$КодОпоры",
              "@lastSource": "keep",
            },
          },
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow);
