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
  comment: "Формирование данных по Tower для загрузки в интеграционную БД",
  input: thisCol.KISUR_Tower,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,
  pipeline: new Pipeline()
    .entityExtId("КодУчастка", "КИСУР", "AccountPartLine")
    .lookupSelf()
    .unwindEntity()
    .project({
      model: {
        "@type": "Tower",
        "@action": "create",
        "@id": "$КодОпоры",
        "@idSource": "КИСУР",
        "@lastSource": "keep",
        IdentifiedObject_name: "$Наименование",
        Tower_AccountPartLine: {
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
      },
    })
    .build(),
};

// utils.compileFlow(flow);
