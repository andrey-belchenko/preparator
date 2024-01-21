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
import * as scenarioCol from "scenario/004-new/_collections";

//TODO: NodesStatus некорректное имя, переименовать в lineStatus
export const flow: SingleStepFlow = {
  comment: "Формирование витрины по состоянию линий",
  src: __filename,
  input: scenarioCol.flow_lineStatusBuffer,
  output: thisCol.NodesStatus,
  operationType: OperationType.syncWithDelete, //  на будущее, по факту сейчас удаление не реализовано
  mergeKey: "id",
  pipeline: new Pipeline()

    .entityId("segmentId", "ACLineSegment")
    .lookupSelf("s")
    .unwindEntity()
    .entityId("lineId", "Line")
    .lookupSelf("l")
    .unwindEntity()
    .lookupParent("Line_Region", "r")
    .unwindEntity()
    .project({
      changedAt: "$changedAt",
      id: "$s.id",
      deletedAt: "$deletedAt",
      region: "$r.model.IdentifiedObject_name",
      lineCode: "$lineCode",
      lineName: "$l.model.IdentifiedObject_name",
      lineStatus: statusMap("$lineStatus"),
      segmentId: "$s.id",
      segmentName: "$s.model.IdentifiedObject_name",
      segmentStatus: statusMap("$segmentStatus"),
      energized1: energizedMap("$energized1"),
      grounded1: groundedMap("$grounded1"),
      energized2: energizedMap("$energized2"),
      grounded2: groundedMap("$grounded2"),
    })
    .build(),
};

export function statusMap(field: string) {
  return map(field, {
    "2": "Отключен, не заземлен",
    "1": "Подключен, не заземлен",
    "0": "Отключен, заземлен",
    "-1": "Не определено",
  });
}

function energizedMap(field: string) {
  return map(field, {
    "1": "Под напряжением",
    "0": "Не определено",
    "-1": "Не под напряжением",
  });
}

function groundedMap(field: string) {
  return map(field, {
    "2": "Заземлено в соседнем РУ",
    "1": "Заземлено в текущем РУ",
    "0": "Не определено",
    "-1": "Не заземлено",
  });
}

function map(field: string, map: any) {
  let branches: any[] = [];
  for (let name in map) {
    branches.push({
      case: {
        $eq: [{ $toString: field }, name],
      },
      then: map[name],
    });
  }
  return {
    $switch: {
      branches: branches,
      default: null,
    },
  };
}
//  utils.compileFlow(flow)
