import * as model_Switch from "./model_Switch";
import { Flow, MultiStepFlow } from "_sys/classes/Flow";

import * as thisCol from "../_collections";
import * as flow_ChangedTower from "../common/flow_ChangedTower";

export const flows: Flow[] = [
  {
    trigger: thisCol.in_РазделениеУчасткаМагистралиКА,
    operation: [model_Switch.flow, flow_ChangedTower.flow],
  },
];
