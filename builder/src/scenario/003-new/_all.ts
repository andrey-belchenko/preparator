import { Flow } from "_sys/classes/Flow";
import * as process from "./process/_all";
import * as input from "./input/_all";
import * as output from "./output/_all";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";

export const flows: Flow[] = [
  ...input.flows,
   ...process.flows,
   ...output.flows
];

export const indexes: CollectionIndexSet[] = [...process.indexes];
