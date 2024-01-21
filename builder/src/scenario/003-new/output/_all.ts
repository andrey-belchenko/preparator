import { Flow } from "_sys/classes/Flow";
import * as out_Rgis_ACLineSegment from "./out_Rgis_ACLineSegment";
import * as out_Rgis_Switch from "./out_Rgis_Switch";
import * as out_Rgis_ACLineSegment_delete from "./out_Rgis_ACLineSegment_delete";
import * as utils from "_sys/utils"
import * as trig from "triggers"
export const flows: Flow[] = [
  utils.createFullRefreshFlow(out_Rgis_ACLineSegment.flow,false,trig.trigger_aclsToRgis),
  out_Rgis_ACLineSegment_delete.flow,
  out_Rgis_ACLineSegment.flow,
  out_Rgis_Switch.flow,
];
