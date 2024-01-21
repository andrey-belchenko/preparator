import { Flow, OperationType } from "_sys/classes/Flow";
// import * as skSentObjects from "./skSentObjects";
import * as skMarkers from "./skMarkers";
import * as skSwitchesStat from "./skSwitchesStat";
import * as NodesStatus from "./NodesStatus";
import * as utils from "_sys/utils";
import * as trig from "triggers"

// var flowsWithFullRefresh = [
//   // viewSubstation.flow,
//   // viewVoltageLevel.flow,
// ];

export const flows: Flow[] = [
  // ...flowsWithFullRefresh,
  // skSentObjects.flow,
  skMarkers.flow,
  skSwitchesStat.flow,
  NodesStatus.flow
  // warnings.flow,
  // messageLog.flow,
];

// export const fullRefreshFlow = utils.createFullRefreshRule(
//   trig.trigger_view_dataMart,
//   false,
//   flowsWithFullRefresh
// );


