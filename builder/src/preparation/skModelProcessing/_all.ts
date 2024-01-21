import { Flow, OperationType } from "_sys/classes/Flow";
import * as Terminal_index from "./Terminal_index";
import * as Equipment_RootContainer from "./Equipment_RootContainer";
import * as extId from "./extId";
import * as lineNotMatchedFlag from "./lineNotMatchedFlag";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";
import * as trig from "triggers";

export const flows: Flow[] = [
  {
    trigger: trig.trigger_ProcessSkModel,
    operation: [
      Equipment_RootContainer.flow,
      Terminal_index.flow,
      extId.flow,
      lineNotMatchedFlag.flow,
    ],
  },
  {
    trigger: trig.trigger_RootContainer,
    operation: [Equipment_RootContainer.flow],
  },
];

export const indexes: CollectionIndexSet[] = [...Terminal_index.indexes];
