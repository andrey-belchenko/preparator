import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as col from "collections";
import * as thisCol from "./_collections";
import * as utils from "_sys/utils";
import { Pipeline } from "_sys/classes/Pipeline";
import * as trig from "triggers";

export const flow: MultiStepFlow = {
  trigger: trig.trigger_MatchedLineInfo,
  src: __filename,
  comment: "Информация о сопоставленных линиях",
  operation: [
    {
      input: col.dm_Line,
      output: thisCol.MatchedLineInfo,
      operationType: OperationType.replace,
      useDefaultFilter: false,
      pipeline: new Pipeline()
        // .matchExpr({ $not: "$model.Line_isNotMatched" })
        .entity("Line")
        .lookupParentOfType("SubGeographicalRegion", "Line_Region", "r")
        .unwindEntity()
        .lookup({
          let: {
            code: "$extId.КИСУР",
          },
          from: thisCol.LineSegmentSchemaNodes,
          pipeline: new Pipeline()
            .matchExpr({ $eq: ["$lineCode", "$$code"] })
            .matchExpr("$isRoot")
            .build(),
          as: "root",
        })
        .lookup({
          let: {
            code: "$extId.КИСУР",
          },
          from: thisCol.LineSegmentSchemaNodes,
          pipeline: new Pipeline()
            .matchExpr({ $eq: ["$lineCode", "$$code"] })
            .matchExpr("$matched")
            .build(),
          as: "matched",
        })
        .lookup({
          let: {
            code: "$extId.КИСУР",
          },
          from: thisCol.LineSegmentSchemaNodes,
          pipeline: new Pipeline()
            .matchExpr({ $eq: ["$lineCode", "$$code"] })
            .matchExpr("$aclsId")
            .matchExpr({ $not: "$matched" })
            .project({
              id: "$aclsId",
              name: "$aclsName",
              needMatch: "$needMatch",
              isCustomerEquipment: { $not: "$needMatch" },
            })
            .build(),
          as: "notMatched",
        })
        .project({
          id: "$id",
          code: "$extId.КИСУР",
          name: "$model.IdentifiedObject_name",
          region: "$r.model.IdentifiedObject_name",
          rootName: { $first: "$root.text" },
          matchedCount: { $size: "$matched" },
          notMatchedCount: { $size: "$notMatched" },
          needMatchCount: {
            $size: {
              $filter: {
                input: "$notMatched",
                as: "it",
                cond: "$$it.needMatch",
              },
            },
          },
          notMatched: "$notMatched",
          withMatching: { $cond: ["$model.Line_isNotMatched", "Нет", "Да"] },
        })
        .build(),
    },
  ],
};

// utils.compileFlow(flow.operation[0] as SingleStepFlow);
