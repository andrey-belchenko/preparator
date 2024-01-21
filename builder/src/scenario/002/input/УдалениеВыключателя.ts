import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_УдалениеВыключателя",
  output: sysCol.model_Input,
  idSource: "КИСУР",
  pipeline: [
    ...filterSteps(),
    ...addTransformSteps([
      //transformSteps generated code begin
      {
        $project: {
          "payload.КодСобытия": "$payload.verb",
          "payload.СистемаИсточник": "$payload.source",
          "payload.Тело.КодТехническогоОбъекта": "$payload.body.code",
          "payload.Тело.НаименованиеПользователяСАП": "$payload.body.exfname",
          messageId: "$messageId",
        },
      },
      //transformSteps generated code end
    ]),
    {
      $addFields: {
        "payload.messageId": "$messageId",
      },
    },
    { $replaceRoot: { newRoot: "$payload" } },
    {
      $project: {
        messageId: "$messageId",
        model: {
          "@type": "Breaker",
          "@action": "delete",
          "@id": "$Тело.КодТехническогоОбъекта",
        },
      },
    },
  ],
};
