
import * as out_skNodeStatusRequest from "./out_skNodeStatusRequest";
import * as out_Rgis from "./out_Rgis";
import * as model_Input_SvTopology from "./model_Input_SvTopology";
import * as col from "collections";
import { Flow } from "_sys/classes/Flow";
export const flows: Flow[] = [
  out_skNodeStatusRequest.flow,
  {
    trigger: col.in_skNodeStatusResponse,
    operation: [
      model_Input_SvTopology.flow,
      out_Rgis.flow,
    ],
  }
];
