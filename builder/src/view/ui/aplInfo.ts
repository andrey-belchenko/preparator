import {
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as sysFlowTags from "_sys/flowTags";
// import * as col from "collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as thisCol from "./collections";

export const aplFlow: SingleStepFlow = {
  input: col.dm_LineSpan,
  output: thisCol.view_aplInfo,
  operationType: OperationType.syncWithDelete,
  comment:"Информация об обработке участков магистрали из КИСУР",
  mergeKey: "id",
  pipeline: new Pipeline()
    .entity("LineSpan")
    .lookupParentOfType("AccountPartLine", "LineSpan_AccountPartLine", "apl")
    .unwindEntity()
    .group({
      _id: "$apl.id",
      apl: { $first: "$apl" },
      isInUse: { $max: "$model.LineSpan_isInUse" },
    })
    .entity("AccountPartLine", "apl")
    .lookupParentOfType("Line", "AccountPartLine_Line", "l")
    .unwindEntity()
    .lookupParentOfType("SubGeographicalRegion", "Line_Region", "r")
    .unwindEntity()
    .project({
      id: "$apl.id",
      type: "$apl.type",
      name: "$apl.model.IdentifiedObject_name",
      entityCreatedAt: "$apl.createdAt",
      entityChangedAt: "$apl.changedAt",
      code: "$apl.extId.КИСУР",
      lineCode: "$l.extId.КИСУР",
      lineName: "$l.model.IdentifiedObject_name",
      region: "$r.model.IdentifiedObject_name",
      deletedAt: "$apl.deletedAt",
      status: {
        $switch: {
          branches: [
            {
              case: "$l.model.Line_isNotMatched",
              then: "Линия не сопоставлена",
            },
            {
              case: { $not: "$isInUse" },
              then: "Отсутствует подключение",
            },
          ],
          default: "Обработан",
        },
      },
    })
    .build(),
};

export const switchFlow:SingleStepFlow ={
  input: col.dm_LineSpan,
  output: thisCol.view_aplInfo,
  operationType: OperationType.syncWithDelete,
  comment:"Информация об обработке КА на линиях из КИСУР",
  mergeKey: "id",
  pipeline: new Pipeline()
    .entity("LineSpan")
    .lookupChildren( "LineSpan_Switches","s" )
    .unwindEntity()
    .lookupParent("IdentifiedObject_ParentObject", "l")
    .unwindEntity()
    .lookupParent("Line_Region", "r")
    .unwindEntity()
    .project({
      id: "$s.id",
      name: "$s.model.IdentifiedObject_name",
      type: "$s.type",
      entityCreatedAt: "$s.createdAt",
      entityChangedAt: "$s.changedAt",
      code: "$s.extId.processor",
      lineCode: "$l.extId.КИСУР",
      lineName: "$l.model.IdentifiedObject_name",
      region: "$r.model.IdentifiedObject_name",
      deletedAt: "$s.deletedAt",
      status: {
        $switch: {
          branches: [
            {
              case: "$l.model.Line_isNotMatched",
              then: "Линия не сопоставлена",
            },
          ],
          default: "Обработан",
        },
      },
    })
    .build(),
};



export const switchFlow1:SingleStepFlow ={
  input: col.model_Links,
  output: thisCol.view_aplInfo,
  operationType: OperationType.syncWithDelete,
  comment:"Информация об обработке КА на линиях из КИСУР",
  mergeKey: "id",
  pipeline: new Pipeline()
    .match({ predicate: "Switch_LineSpan" })
    .entityId("fromId")
    .lookupSelf("s")
    .unwindEntity()
    .lookupParent("IdentifiedObject_ParentObject", "l")
    .unwindEntity()
    .lookupParent("Line_Region", "r")
    .unwindEntity()
    .project({
      id: "$s.id",
      name: "$s.model.IdentifiedObject_name",
      type: "$s.type",
      entityCreatedAt: "$s.createdAt",
      entityChangedAt: "$s.changedAt",
      code: "$s.extId.processor",
      lineCode: "$l.extId.КИСУР",
      lineName: "$l.model.IdentifiedObject_name",
      region: "$r.model.IdentifiedObject_name",
      deletedAt: "$s.deletedAt",
      status: {
        $switch: {
          branches: [
            {
              case: "$l.model.Line_isNotMatched",
              then: "Линия не сопоставлена",
            },
          ],
          default: "Обработан",
        },
      },
    })
    .build(),
};

export const flow: MultiStepFlow = {
  src: __filename,
  comment: "Информация об обработке участков магистрали и КА из КИСУР",
  isParallel: false,
  operation: [
    aplFlow,
    switchFlow,
  ],
};

// utils.compileFlow(flow.operation[0]);
