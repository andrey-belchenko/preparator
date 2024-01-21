import * as thisCol from "./_collections";
import * as flow_Сегмент from "./flow_Сегмент";
import * as model_AccountPartLine from "./model_AccountPartLine";
import * as model_Tower from "./model_Tower";
import * as model_LineSpan from "./model_LineSpan";
import * as model_Tower_LineSpan from "./model_Tower_LineSpan";

import { Flow, MultiStepFlow } from "_sys/classes/Flow";
import * as flow_ChangedTower from "../common/flow_ChangedTower";

import * as model_AccountPartLine_postprocess from "./model_AccountPartLine_postprocess";

export const flows: Flow[] = [
  ...flow_Сегмент.flows,
  {
    trigger: thisCol.flow_Сегмент,
    operation: [
      {
        isParallel: true,
        operation: [
          model_AccountPartLine.flow,
          model_Tower.flow,
          model_LineSpan.flow,
        ],
      },
      model_Tower_LineSpan.flow,
      ...model_AccountPartLine_postprocess.flows,
      flow_ChangedTower.flow,

    ],
  },
];
