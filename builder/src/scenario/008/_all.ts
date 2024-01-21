import * as col from "collections";
import { Flow } from "_sys/classes/Flow";

import * as flow_Markers_new from "./flow_Markers_new";
import * as flow_Markers_warning from "./flow_Markers_warning";
import * as flow_Markers_created from "./flow_Markers_created";
import * as flow_Markers_deleted from "./flow_Markers_deleted";
import * as flow_Markers_last from "./flow_Markers_last";
import * as Markers from "./Markers";
import * as Markers_postprocess from "./Markers_postprocess";
import * as Markers_postprocess1 from "./Markers_postprocess1";
import * as out_rgis_add_all from "./out_rgis_add_all";
import * as out_rgis_add_warning from "./out_rgis_add_warning";
import * as out_rgis_add from "./out_rgis_add";
import * as out_rgis_del from "./out_rgis_del";

export const flows: Flow[] = [
  {
    trigger: col.in_Markers,
    operation: [
      flow_Markers_new.flow,
      flow_Markers_warning.flow,
      flow_Markers_created.flow,
      flow_Markers_deleted.flow,
      ...Markers.flow,
      Markers_postprocess.flow,
      Markers_postprocess1.flow,
      flow_Markers_last.flow,
      out_rgis_add_all.flow,
      out_rgis_add_warning.flow,
      out_rgis_add.flow,
      out_rgis_del.flow,
    ],
  },
];
