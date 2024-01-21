import * as out_MonitoredNodes from "./out_MonitoredNodes";
import * as flow_NodesStatus from "./flow_NodesStatus";
import * as model_SvTopology from "./model_SvTopology";
import * as flow_lineStatusBuffer from "./flow_lineStatusBuffer";
import * as out_Rgis from "./out_Rgis";
import * as col from "collections";
import { Flow } from "_sys/classes/Flow";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils"
import * as trig from "triggers"
export const flows: Flow[] = [
  out_MonitoredNodes.flow,
  utils.createFullRefreshRule(trig.trigger_MonitoredItems,false,[out_MonitoredNodes.flow]),
  {
    trigger: thisCol.in_NodesStatus,
    operation: [flow_NodesStatus.flow, model_SvTopology.flow,flow_lineStatusBuffer.flow, out_Rgis.flow],
  },
];
