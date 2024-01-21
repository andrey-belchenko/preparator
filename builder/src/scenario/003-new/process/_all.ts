import { Flow } from "_sys/classes/Flow";
import * as flow_LineSpan_buffer from "./flow_LineSpan_buffer";
import * as inputCol from "../input/_collections";
import * as flow_LineSpan_ACLineSegment_new from "./flow_LineSpan_ACLineSegment_new";
import * as flow_LineSpan_ACLineSegment_old from "./flow_LineSpan_ACLineSegment_old";
import * as flow_LineSpan_ACLineSegment_forUpsert from "./flow_LineSpan_ACLineSegment_forUpsert";
import * as flow_LineSpan_ACLineSegment_forDelete from "./flow_LineSpan_ACLineSegment_forDelete";

import * as flow_ACLineSegment_new from "./flow_ACLineSegment_new";
import * as flow_ACLineSegment_old from "./flow_ACLineSegment_old";
import * as flow_ACLineSegment_forUpsert from "./flow_ACLineSegment_forUpsert";
import * as flow_ACLineSegment_forDelete from "./flow_ACLineSegment_forDelete";

import * as flow_ConnectivityNode_new from "./flow_ConnectivityNode_new";
import * as flow_ConnectivityNode_old from "./flow_ConnectivityNode_old";
import * as flow_ConnectivityNode_forUpsert from "./flow_ConnectivityNode_forUpsert";
import * as flow_ConnectivityNode_forDelete from "./flow_ConnectivityNode_forDelete";

import * as flow_Terminal_new from "./flow_Terminal_new";
import * as flow_Terminal_old from "./flow_Terminal_old";
import * as flow_Terminal_forUpsert from "./flow_Terminal_forUpsert";
import * as flow_Terminal_forDelete from "./flow_Terminal_forDelete";

import * as flow_ConnectivityNode_name from "./flow_ConnectivityNode_name";
import * as flow_ACLineSegment_name from "./flow_ACLineSegment_name";
import * as flow_ACLineSegment_data from "./flow_ACLineSegment_data";

import * as model_ACLineSegment from "./model_ACLineSegment";
import * as model_LineSpan_ACLineSegment from "./model_LineSpan_ACLineSegment";
import * as model_ConnectivityNode from "./model_ConnectivityNode";
import * as model_Terminal from "./model_Terminal";

import * as thisCol from "./_collections";
import { CollectionIndexSet } from "_sys/classes/CollectionIndexSet";

import * as flow_affectedItems from "./flow_affectedItems";

import * as model_fakeSegment from "./model_fakeSegment";
import * as model_postprocess from "./model_Line_postprocess";
import * as aplInfo from "view/ui/aplInfo";
// import * as model_LineSpan_dangling from "./_DELETEmodel_LineSpan_dangling";
export const flows: Flow[] = [
  {
    trigger: inputCol.flow_changed_Tower,
    operation: [
      model_fakeSegment.flow,
      ...model_postprocess.flows(true),
      flow_affectedItems.flow,
      // model_LineSpan_dangling.flow,
      ...flow_LineSpan_buffer.flows,

      flow_LineSpan_ACLineSegment_new.flow,

      ...flow_ACLineSegment_old.flows,
      ...flow_ACLineSegment_new.flows,
      
      flow_ACLineSegment_forDelete.flow,

      flow_LineSpan_ACLineSegment_old.flow,
      flow_LineSpan_ACLineSegment_forUpsert.flow,
      flow_LineSpan_ACLineSegment_forDelete.flow,

      flow_Terminal_old.flow,

      flow_ConnectivityNode_old.flow,
      flow_ConnectivityNode_new.flow,
      flow_ConnectivityNode_forUpsert.flow,
      flow_ConnectivityNode_forDelete.flow,

      flow_Terminal_new.flow,
      flow_Terminal_forUpsert.flow,
      flow_Terminal_forDelete.flow,
      ...flow_ConnectivityNode_name.flows,
      flow_ACLineSegment_name.flow,
      flow_ACLineSegment_data.flow,
      flow_ACLineSegment_forUpsert.flow,
      {
        isParallel: true,
        operation: [
          ...model_ACLineSegment.flows,
          ...model_LineSpan_ACLineSegment.flows,
          ...model_ConnectivityNode.flows,
          ...model_Terminal.flows,
        ],
      },
      // aplInfo.flow
    ],
  },
];

export const indexes: CollectionIndexSet[] = [
  {
    collection: thisCol.flow_ACLineSegment_old,
    indexes: [["platformId"]],
  },
  {
    collection: thisCol.flow_ACLineSegment_new,
    indexes: [["lastLsId"]],
  },
];
