import { Flow, OperationType } from "_sys/classes/Flow";
import * as LineSegmentTree from "./LineSegmentTree";
import * as LineSegmentSchemaElements from "./LineSegmentSchemaElements";
import * as LineSpanSchemaElements from "./LineSpanSchemaElements";
import * as LineMatchSchemaElements from "./LineMatchSchemaElements";
import * as LineEquipmentSchemaElements from "./LineEquipmentSchemaElements";
import * as MatchedLineInfo from "./MatchedLineInfo";
export const flows: Flow[] = [
  // LineSegmentTree.flow,
  LineSegmentSchemaElements.flow,
  LineSpanSchemaElements.flow,
  LineMatchSchemaElements.flow,
  LineEquipmentSchemaElements.flow,
  MatchedLineInfo.flow,
];
