import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: SingleStepFlow = {
  comment:
    "Промежуточной таблицы по объектам отправленным в СК-11 для витрины и рассылки уведомлений",
  src: __filename,
  input: col.out_Sk11,
  output: col.flow_skSentObjects,
  operationType: OperationType.sync,
  mergeKey: "id",
  pipeline: new Pipeline()
    .matchExpr({ $in: ["$itemType", ["entity", "field"]] })
    .group({ _id: "$id", changedAt: { $max: "$changedAt" } })
    .entityId("_id")
    // .match({ _id: "f8b92fd8-99e4-4ec1-b956-2c6b2f4f5299" }) 
    .lookupSelfWithDeleted("e")
    .unwindEntity()
    .matchExpr({
      $not: {
        $in: ["$e.type", ["Folder", "GenericView"]],
      },
    })
    .entityId("_id")
    .lookupParentWithDeleted("IdentifiedObject_RootContainer", "rc")
    .unwindEntity(true)
    .lookupParentWithDeleted(["Line_Region", "Substation_Region"], "r")
    .unwindEntity(true)
    .project({
      changedAt: "$changedAt",
      itemChangedAt: "$changedAt",
      region: "$r.model.IdentifiedObject_name",
      rcId: "$rc.id",
      rcType: "$rc.type",
      rcName: "$rc.model.IdentifiedObject_name",
      rcCode: "$rc.model.PowerSystemResource_ccsCode",
      id: "$e.initialId",
      type: "$e.type",
      name: "$e.model.IdentifiedObject_name",
      code: "$e.model.PowerSystemResource_ccsCode",
      isCreated: { $cond: ["$e.attr.skLoadedAt", false, true] },
      isDeleted: { $not:{$not:"$e.deletedAt"} },
    })
    .build(),
};

// utils.compileFlow(flow);
