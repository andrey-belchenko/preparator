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
    "Удаление AccountPartLine, LineSpan, Tower для перезагрузки",
  input: thisCol.KISUR_AccountPartLine,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  useDefaultFilter: false,
  pipeline: new Pipeline()
    .group({_id:"$КодЛинии"})
    .entityExtId("_id","КИСУР","Line")
    .lookupSelf()
    .unwindEntity()
    .inverseLookupChildrenOfType("AccountPartLine","AccountPartLine_Line","apl")
    .unwindEntity()
    .project({
      model: {
        "@type": "AccountPartLine",
        "@action": "delete",
        "@id": "$apl.id",
        "@idSource": "platform",
      },
    })
    .build(),
};

// utils.compileFlow(flow)
