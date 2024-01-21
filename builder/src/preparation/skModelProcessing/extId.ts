import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: SingleStepFlow = {
  src: __filename,
  comment: "Установка extId.КИСУР по PowerSystemResource_ccsCode",
  input: col.model_Entities,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,
  pipeline: new Pipeline()
    .matchExpr({ $not: "$extId.КИСУР" })
    .matchExpr("$model.PowerSystemResource_ccsCode")
    .project({
      model: {
        "@id": {
          platform: "$id",
          КИСУР: "$model.PowerSystemResource_ccsCode",
          // для линейных КА нужен id processor вместо КИСУР см. builder\src\scenario\003-new\input\swtch\model_Switch.ts
          processor: "$model.PowerSystemResource_ccsCode",
        },
        "@action": "update",
        "@type": "$type",
        "@lastSource":"keep",
      },
    })
    .build(),
};

