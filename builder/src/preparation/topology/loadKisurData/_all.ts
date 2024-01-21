import { Flow, OperationType } from "_sys/classes/Flow";
import * as model_AccountPartLine from "./model_AccountPartLine";
import * as model_AccountPartLine_delete from "./model_AccountPartLine_delete";
import * as model_LineSpan from "./model_LineSpan";
import * as model_Tower from "./model_Tower";
import * as model_LineSpan_Tower from "./model_LineSpan_Tower";
import * as model_Switch_LineSpan from "./model_Switch_LineSpan";
import * as model_LineSpan_fake from "./model_LineSpan_fake";
import * as thisCol from "../_collections";
import * as trig from "triggers"
export const flows: Flow[] = [
  {
    trigger:trig.trigger_ClearKisurData,
    operation: [
      model_AccountPartLine_delete.flow,
    ],
  },
  {
    trigger:trig.trigger_LoadKisurData,
    operation: [
      model_AccountPartLine.flow,
      model_LineSpan.flow,
      model_Tower.flow,
      model_LineSpan_Tower.flow,
      model_Switch_LineSpan.flow,
      model_LineSpan_fake.flow,
    ],
  },
];
