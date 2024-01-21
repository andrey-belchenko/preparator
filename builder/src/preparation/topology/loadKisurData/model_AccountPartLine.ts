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

export const flow: SingleStepFlow = {
  src: __filename,
  comment:
    "Формирование данных по AccountPartLine для загрузки в интеграционную БД",
  input: thisCol.KISUR_AccountPartLine,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,

  pipeline: new Pipeline()
    .project({
      model: {
        "@type": "AccountPartLine",
        "@action": "create",
        "@id": "$КодУчастка",
        "@idSource": "КИСУР",
        "@lastSource": "keep",
        IdentifiedObject_name: "$Наименование",
        AccountPartLine_Line: {
          "@type": "Line",
          "@idSource": "КИСУР",
          "@id": "$КодЛинии",
          "@action": "update",
          "@lastSource": "keep",
          PowerSystemResource_ccsCode: "$КодЛинии",
        },
        IdentifiedObject_ParentObject: {
          "@type": "Line",
          "@idSource": "КИСУР",
          "@id": "$КодЛинии",
          "@action": "link",
          "@lastSource": "keep",
        },
      },
    })
    .build(),
};

// utils.compileFlow(flow)
