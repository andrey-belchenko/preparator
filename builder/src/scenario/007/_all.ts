import * as col from "collections";
import { Flow } from "_sys/classes/Flow";

import * as flow_Switches_stat_new from "./flow_Switches_stat_new";
import * as flow_Switches_stat_warning from "./flow_Switches_stat_warning";
import * as flow_Switches_stat_warning2 from "./flow_Switches_stat_warning2";
import * as flow_Switches_stat_warning3 from "./flow_Switches_stat_warning3";
import * as flow_Switches_updated from "./flow_Switches_updated";
import * as Switches_stat from "./Switches_stat";
import * as flow_Switches_stat_last from "./flow_Switches_stat_last";
import * as out_rgis_Switches_stat from "./out_rgis_Switches_stat";
import * as out_MonitoredSwitches from "../007/out_MonitoredSwitches";
import * as utils from "_sys/utils"
import * as trig from "triggers"
export const flows: Flow[] = [
  out_MonitoredSwitches.flow,
  utils.createFullRefreshRule(trig.trigger_MonitoredItems,false,[out_MonitoredSwitches.flow]),
  {
    trigger: col.in_Switches,
    operation: [
      flow_Switches_stat_new.flow,
      flow_Switches_stat_warning.flow,
      flow_Switches_stat_warning2.flow,
      flow_Switches_stat_warning3.flow,
      flow_Switches_updated.flow,
      Switches_stat.flow,
      flow_Switches_stat_last.flow,
      out_rgis_Switches_stat.flow
    ],
  },
];
