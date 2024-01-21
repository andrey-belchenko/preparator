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
  comment: "Установка признака не сопоставленной на все линии",
  input: col.dm_Line,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,
  pipeline: new Pipeline()
    .project({
      model: {
        "@action": "update",
        "@type": "Line",
        "@id": "$id",
        "@idSource": "platform",
        "@lastSource": "keep",
        Line_isNotMatched: { $literal: true },
      },
    })
    .build(),
};
