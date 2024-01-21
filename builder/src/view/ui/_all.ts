import { Flow, OperationType } from "_sys/classes/Flow";
import * as objectTree from "./ObjectTree";
import * as objectTable from "./objectTable";
import * as incomingMessages from "./incomingMessages";
import * as blockedDto from "./blockedDto";
import * as blockedDtoDetails from "./blockedDtoDetails";
import * as extraIdMatching from "./extraIdMatching";
import * as files from "./files";
import * as utils from "_sys/utils";
import * as aplInfo from "./aplInfo";
import * as trig from "triggers";
import * as thisCol from "./collections";
import * as messageLog from "./messageLog";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";
import * as sysCol from "_sys/collections";

export const flows: Flow[] = [
  objectTree.flow,
  objectTable.flow,
  files.flow,
  incomingMessages.flow,
  ...extraIdMatching.flows,
  ...blockedDto.flows,
  blockedDtoDetails.flow,
  messageLog.flow,
  aplInfo.aplFlow,
  aplInfo.switchFlow,
];

export const fullRefreshFlows: Flow[] = [
  utils.createFullRefreshFlow(objectTree.flow, true, trig.trigger_view_ui),
  utils.createFullRefreshFlow(aplInfo.flow, true, trig.trigger_view_ui),
];

let objectTreeIndexes = [
  ["parent"],
  ["name"],
  ["type"],
  ["ccsCode"],
  ["baseCode"],
  ["hasChildren"],
  ["entityCreatedAt"],
  ["entityChangedAt"],
  ["entityDeletedAt"],
];
export const indexes: CollectionIndexSet[] = [
  {
    collection: thisCol.view_objectTree,
    indexes: objectTreeIndexes,
  },
  {
    collection: thisCol.view_objectTreeWithStat,
    indexes: objectTreeIndexes,
  },
  {
    collection: sysCol.sys_model_ExtraIdMatching,
    indexes: [["id", "parent"]],
  },
];
