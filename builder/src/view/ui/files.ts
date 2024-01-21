import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";

import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";

export const flow: Flow = {
  src: __filename,
  comment: "Файлы привязанные к оборудованию",
  input: col.dm_PsrFile,
  output: thisCol.view_files,
  operationType: OperationType.view,
  pipeline: new Pipeline()
  .matchExpr({$not:"$deletedAt"})
  .lookup({
     from:thisCol.view_objectTreeWithStat,
     localField: "model.PsrFile_psr",
     foreignField: "id",
     as:"item"
  })
  .unwind("$item")
  .lookupSelf()
  .build(),
};

// utils.compileFlow(flow)
