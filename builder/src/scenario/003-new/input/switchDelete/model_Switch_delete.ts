import { Flow, MultiStepFlow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as flow_ChangedTower from "../common/flow_ChangedTower";
import { addTransformSteps, resFilterSteps } from "scenario/common/_utils";

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
  trigger: thisCol.in_УдалениеКА,
  operation: [
    {
      src: __filename,
      input: thisCol.in_УдалениеКА,
      output: thisCol.flow_changed_Tower,
      operationType: OperationType.replace,
      pipeline: new Pipeline()
        .addSteps(resFilterSteps())
        .addSteps(transformSteps)
        .replaceRoot("$payload")
        .entityExtId("Тело.КодТехническогоОбъекта", "processor")
        .lookupSelf()
        .unwindEntity()
        .lookupParent("Switch_LineSpan", "ls")
        .unwindEntity()
        .entityId("ls.id", "LineSpan")
        .lookupSelf("ls")
        .unwindEntity()
        .replaceRoot("$ls")
        .addSteps(flow_ChangedTower.pipeline)
        .build(),
    },
    {
      src: __filename,
      input: thisCol.in_УдалениеКА,
      operationType: OperationType.insert,
      output: sysCol.model_Input,
      pipeline: [
        ...transformSteps,
        { $replaceRoot: { newRoot: "$payload" } },
        {
          $project: {
            model: {
              "@id": "$Тело.КодТехническогоОбъекта",
              "@idSource": "processor",
              "@action": "delete",
            },
          },
        },
      ],
    },
    //todo костыль чтобы заодно работало и для КА на подстанциях
    {
      src: __filename,
      input: thisCol.in_УдалениеКА,
      operationType: OperationType.insert,
      output: sysCol.model_Input,
      pipeline: [
        ...transformSteps,
        { $replaceRoot: { newRoot: "$payload" } },
        {
          $project: {
            model: {
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
