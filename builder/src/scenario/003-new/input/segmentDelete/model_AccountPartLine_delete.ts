import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as flow_ChangedTower from "../common/flow_ChangedTower";
import { addTransformSteps, resFilterSteps } from "scenario/common/_utils";

// export const flow: Flow = {
//   src: __filename,
//   input: thisCol.in_УдалениеСегмента,
//   operationType: OperationType.insert,
//   output: sysCol.model_Input,
//   pipeline: [
//     { $replaceRoot: { newRoot: "$payload" } },
//     {
//       $project: {
//         model: {
//           "@type": "AccountPartLine",
//           "@id": "$Тело.КодТехническогоОбъекта",
//           "@idSource": "КИСУР",
//           "@action": "delete",
//         },
//       },
//     },
//   ],
// };

const transformSteps = addTransformSteps([
  {
    $project: {
      "payload.КодСобытия": "$payload.verb",
      "payload.СистемаИсточник": "$payload.source",
      "payload.Тело.КодТехническогоОбъекта": "$payload.body.code",
      messageId: "$messageId",
    },
  },
]);

export const flow: MultiStepFlow = {
  trigger: thisCol.in_УдалениеСегмента,
  operation: [
    {
      src: __filename,
      input: thisCol.in_УдалениеСегмента,
      output: thisCol.flow_changed_Tower,
      operationType: OperationType.replace,
      pipeline: new Pipeline()
        .addSteps(resFilterSteps())
        .addSteps(transformSteps)
        .replaceRoot("$payload")
        .entityExtId("Тело.КодТехническогоОбъекта", "КИСУР", "AccountPartLine")
        .lookupSelf()
        .unwindEntity()
        .inverseLookupChildrenOfType(
          "LineSpan",
          "LineSpan_AccountPartLine",
          "ls"
        )
        .unwindEntity()
        .replaceRoot("$ls")
        .addSteps(flow_ChangedTower.pipeline)
        .build(),
    },

    {
      src: __filename,
      input: thisCol.in_УдалениеСегмента,
      operationType: OperationType.insert,
      output: sysCol.model_Input,
      pipeline: [
        ...transformSteps,
        { $replaceRoot: { newRoot: "$payload" } },
        {
          $project: {
            model: {
              "@type": "AccountPartLine",
              "@id": "$Тело.КодТехническогоОбъекта",
              "@idSource": "КИСУР",
              "@action": "delete",
            },
          },
        },
      ],
    },
  ],
};
