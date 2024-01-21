import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
  WhenMatchedOperation,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as prepCol from "other/topology/_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";

export const flow: SingleStepFlow = {
  comment: "Формирование витрины по пометкам полученным из СК-11",
  src: __filename,
  input: col.dm_Marker,
  output: thisCol.skMarkers,
  operationType: OperationType.syncWithDelete,
  mergeKey: "id",
  pipeline: new Pipeline()

    .entityId("id")
    .lookupParent("Marker_CreatedBy", "Person")
    .unwindEntity(true)

    .entityId("id")
    .lookupParent("Marker_TypeMarker", "MarkerType")
    .unwindEntity(true)

    .entityId("id")
    .lookupParent("Marker_EquipmentContainer", "EquipmentContainer")
    .unwindEntity(true)

    .entityId("id")
    .lookupParent("IdentifiedObject_ParentObject", "ParentObject")
    .unwindEntity(true)

    .lookupParent("IdentifiedObject_RootContainer", "rc")
    .unwindEntity(true)
    .lookupParent(["Line_Region", "Substation_Region"], "r")
    .unwindEntity(true)

    .entityId("id")
    .lookupParent("Marker_Equipment", "Equipment")
    .unwindEntity(true)

    .project({
      changedAt: "$changedAt",
      id: "$initialId",
      deletedAt: "$deletedAt",
      Тип: "$MarkerType.model.IdentifiedObject_name",
      ВремяСоздания: "$model.Marker_TimeCreated",
      Комментарий: "$model.Marker_Text",
      РЭС: "$r.model.IdentifiedObject_name",
      Объект: "$EquipmentContainer.model.IdentifiedObject_name",
      Оборудование: {
        $ifNull: [
          "$ParentObject.model.IdentifiedObject_name",
          "$Equipment.model.IdentifiedObject_name",
        ],
      },
      Автор: "$Person.model.IdentifiedObject_name",
    })
    .build(),
};

//  utils.compileFlow(flow)
