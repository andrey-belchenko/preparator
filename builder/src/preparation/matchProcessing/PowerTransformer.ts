import {
  Flow,
  MultiStepFlow,
  OperationType,
  SingleStepFlow,
} from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as utils from "_sys/utils";
import { Expression, Pipeline } from "_sys/classes/Pipeline";

// функция с параметром useDefaultFilter чтобы можно было вызывать правило и для всех объектов и только для измененных при обработке "отложенных сообщений"

// TransformerEnd_endNumber: 2,
export function createFlow(useDefaultFilter: boolean): MultiStepFlow {
  return {
    src: __filename,
    comment:
      "Добавление ключей для дополнительного оборудования трансформатора",
    operation: [
      {
        isParallel: true,
        operation: [
          operation(
            useDefaultFilter,
            "PowerTransformerEnd",
            new Pipeline().matchExpr("$a.model.TransformerEnd_endNumber"),
            {
              $concat: [
                {
                  $cond: [
                    { $eq: ["$a.model.TransformerEnd_endNumber", 1] },
                    "PowerTransformerEndH",
                    "PowerTransformerEndL",
                  ],
                },
                "$extId.КИСУР",
              ],
            }
          ),
          operation(useDefaultFilter, "NoLoadTestME", new Pipeline(), {
            $concat: ["NoLoadTestME", "$extId.КИСУР"],
          }),
          operation(useDefaultFilter, "ShortCircuitTestME", new Pipeline(), {
            $concat: ["ShortCircuitTestME", "$extId.КИСУР"],
          }),
          operation(
            useDefaultFilter,
            "TransformerMeshImpedance",
            new Pipeline(),
            {
              $concat: ["TransformerMeshImpedance", "$extId.КИСУР"],
            }
          ),
        ],
      },
      {
        input: col.dm_PowerTransformerEnd,
        output: sysCol.model_Input,
        operationType: OperationType.insert,
        useDefaultFilter: useDefaultFilter,
        pipeline: new Pipeline()
          .matchExpr("$extId.КИСУР")
          .inverseLookupChildrenOfType(
            "Terminal",
            "IdentifiedObject_ParentObject",
            "t"
          )
          .unwindEntity()
          .addFields({
            // базовый id такой же как в задается в правилах обработки сообщений
            extId: {
              $concat: [
                "$extId.КИСУР",
                "-T",
                { $toString: "$t.model.ACDCTerminal_sequenceNumber" },
              ],
            },
          })
          .project({
            model: {
              "@type": "Terminal",
              "@action": "update",
              "@lastSource":"keep",
              "@id": {
                platform: "$t.id",
                КИСУР: "$extId",
                processor: "$extId",
              },
            },
          })
          .build(),
      },
    ],
  };
}
function operation(
  useDefaultFilter: boolean,
  type: string,
  childFilter: Pipeline,
  idExpr: Expression
): SingleStepFlow {
  return {
    src: __filename,
    input: col.dm_PowerTransformer,
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    useDefaultFilter: useDefaultFilter,
    pipeline: new Pipeline()
      .matchExpr("$extId.КИСУР")
      .entityId("id", "PowerTransformer")
      .inverseLookupChildrenOfType(type, "IdentifiedObject_ParentObject", "a")
      .unwindEntity()
      .addStepsFromPipeline(childFilter)
      .addFields({
        // базовый id такой же как в задается в правилах обработки сообщений
        extId: idExpr,
      })
      .project({
        model: {
          "@action": "update",
          "@lastSource":"keep",
          "@id": {
            platform: "$a.id",
            КИСУР: "$extId",
            processor: "$extId",
          },
        },
      })
      .build(),
  };
}

// export const flow: MultiStepFlow = createFlow(false);

// utils.compileFlow(flow.operation[1]);
