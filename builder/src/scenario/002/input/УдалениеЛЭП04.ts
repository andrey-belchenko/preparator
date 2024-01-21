import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_УдалениеЛЭП04",
  output: sysCol.model_Input,
  idSource: "КИСУР",
  pipeline: [
    ...filterSteps(),// Этот фильтр не может быть пройден т.к. в код ЛЭП 0.4 не начинается с кода ТП и в сообщении на удаление нет ссылки на вышестоящий объект, из которого можно взять код (так делается при создании), оставляю т.к. решение временное пока сойдет. 
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
          "@type": "NonConformLoad",
          "@action": "delete",
          "@id": "$Тело.КодТехническогоОбъекта",
        },
      },
    },
  ],
};
