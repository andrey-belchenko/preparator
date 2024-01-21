import { Flow, OperationType } from "_sys/classes/Flow";
import * as topology from "./topology/_all";
import * as skModelProcess from "./skModelProcessing/_all";
import * as matchProcessing from "./matchProcessing/_all";
import * as switchesToRgis from "./switchesToRgis/_all";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";

export const flows: Flow[] = [
  ...topology.flows,
  ...skModelProcess.flows,
  ...matchProcessing.flows,
  ...switchesToRgis.flows,
];
export const indexes: CollectionIndexSet[] = [...skModelProcess.indexes];
