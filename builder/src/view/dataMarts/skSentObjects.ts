import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

// TODO не используется, убрать
export const flow: SingleStepFlow = {
  comment: "Формирование витрины по объектам отправляемым в СК-11",
  src: __filename,
  input: col.out_Sk11,
  output: thisCol.skChangedObjects,
  operationType: OperationType.sync,
  mergeKey: "id",
  pipeline: new Pipeline()
    .group({ _id: "$id", changedAt: { $max: "$changedAt" } })
    .entityId("_id")
    .lookupSelf("e")
    .unwindEntity()
    .matchExpr({
      $not: {
        $in: ["$e.type", ["Folder", "GenericView"]],
      },
    })
    .lookupParent("IdentifiedObject_RootContainer", "rc")
    .unwindEntity(true)
    .lookupParent(["Line_Region", "Substation_Region"], "r")
    .unwindEntity(true)
    .project({
      changedAt: "$changedAt",
      region: "$r.model.IdentifiedObject_name",
      rcId: "$rc.id",
      rcType: "$rc.type",
      rcName: "$rc.model.IdentifiedObject_name",
      rcCode: "$rc.model.PowerSystemResource_ccsCode",
      id: "$e.id",
      type: "$e.type",
      name: "$e.model.IdentifiedObject_name",
      code: "$e.model.PowerSystemResource_ccsCode",
    })
    .build(),
};

//  utils.compileFlow(flow)
