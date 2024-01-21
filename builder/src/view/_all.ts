import { Flow, OperationType } from "_sys/classes/Flow";
import * as topology from "./topology/_all";
import * as dm from "./dataMarts/_all";
import * as ui from "./ui/_all";

import * as utils from "_sys/utils";
import * as sysFlowTags from "_sys/flowTags";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";
var onlineFlows = [...dm.flows, ...ui.flows];

utils.addOnlineProcessingTag(onlineFlows);

export const flows: Flow[] = [
  ...onlineFlows,
  ...topology.flows,
  ...ui.fullRefreshFlows,
  // dm.fullRefreshFlow
];

export const indexes: CollectionIndexSet[] = [
  ...ui.indexes
];
