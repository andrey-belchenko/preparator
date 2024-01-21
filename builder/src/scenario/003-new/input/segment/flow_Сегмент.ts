import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import { addLineCodeSteps } from "../_utils";
import { addTransformSteps, resFilterSteps } from "scenario/common/_utils";
import * as utils from "_sys/utils";

function transformSteps() {
  return [
    {
      $project: {
        "payload.КодСобытия": "$payload.verb",
        "payload.СистемаИсточник": "$payload.source",
        "payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта":
          "$payload.body.element.code",
        "payload.Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта":
          "$payload.body.element.name",
        "payload.Тело.ЭлементСтруктурыСети.НаименованиеПользователяСАП":
          "$payload.body.element.exfname",
        "payload.Тело.ЭлементСтруктурыСети.НоминальноеНапряжение":
          "$payload.body.element.basevoltage",
        "payload.Тело.ЭлементСтруктурыСети.БалансоваяПринадлежность":
          "$payload.body.element.balance_sign",
        "payload.Тело.ЭлементСтруктурыСети.ТипОбъекта":
          "$payload.body.element.type",
        "payload.Тело.ЭлементСтруктурыСети.ПользовательскийСтатус":
          "$payload.body.element.user_stat",
        "payload.Тело.ЭлементСтруктурыСети.Нач_Кон_Опоры": {
          $map: {
            input: "$payload.body.element.beg_end_pillar",
            as: "it",
            in: {
              КодТехническогоОбъекта: "$$it.code",
              НаименованиеТехнОбъекта: "$$it.name",
            },
          },
        },
        "payload.Тело.ЭлементСтруктурыСети.Пролеты": {
          $map: {
            input: "$payload.body.element.span",
            as: "it",
            in: {
              КодТехническогоОбъекта: "$$it.code",
              НаименованиеТехнОбъекта: "$$it.name",
              ДлинаПролета: "$$it.spanlength",
            },
          },
        },
        "payload.Тело.ЭлементСтруктурыСети.Опоры": {
          $map: {
            input: "$payload.body.element.pillar",
            as: "it",
            in: {
              КодТехническогоОбъекта: "$$it.code",
              НаименованиеТехнОбъекта: "$$it.name",
            },
          },
        },
        "payload.Тело.ЭлементСтруктурыСети.Соединения": {
          $map: {
            input: "$payload.body.element.connection",
            as: "it",
            in: {
              "Соединение от": "$$it.tpvon",
              "Соединение к": "$$it.tpnach",
              "Соединяющий объект": "$$it.tpkant",
            },
          },
        },
        "payload.Тело.ЭлементСтруктурыСети.НазваниеКомпонента": {
          $map: {
            input: "$payload.body.element.span",
            as: "it",
            in: {
              КодТехническогоОбъекта: "$$it.code",
              ФазаA: {
                $ifNull: [{ $arrayElemAt: ["$$it.wirebrand", 0] }, null],
              },
              ФазаB: {
                $ifNull: [{ $arrayElemAt: ["$$it.wirebrand", 1] }, null],
              },
              ФазаC: {
                $ifNull: [{ $arrayElemAt: ["$$it.wirebrand", 2] }, null],
              },
            },
          },
        },
        "payload.Тело.ЭлементСтруктурыСети.ВспомогательноеОборудования":
          "$payload.body.element.support_equipment",
        "payload.Тело.ЛЭП.КодТехническогоОбъекта":
          "$payload.body.element.lep.code",
        "payload.Тело.УчастокМагистрали.КодТехническогоОбъекта":
          "$payload.body.element.segment.code",
        messageId: "$messageId",
      },
    },
  ];
}

export const flows: Flow[] = [
  {
    src: __filename,
    input: "in_СозданиеУчасткаМагистрали",
    output: thisCol.flow_Сегмент,
    operationType: OperationType.sync,
    pipeline: [
      ...resFilterSteps(),
      ...addTransformSteps(transformSteps()),
      {
        $addFields: {
          _id: "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
          "payload.Отпайка": false,
          "payload.Линия": "$payload.Тело.ЛЭП.КодТехническогоОбъекта",
          "payload.isSegment": true,
        },
      },
    ],
  },
  {
    src: __filename,
    input: "in_СозданиеОтпайки",
    output: thisCol.flow_Сегмент,
    operationType: OperationType.sync,
    pipeline: [
      ...resFilterSteps(),
      ...addTransformSteps(transformSteps()),
      {
       
        $addFields: {
          _id: "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
          "payload.Отпайка": true,
          "payload.Участок":
            "$payload.Тело.УчастокМагистрали.КодТехническогоОбъекта",
          "payload.isSegment": true,
        },
      },
      ...addLineCodeSteps(),
    ],
  },
];

// utils.compileFlow(flows[0]);
