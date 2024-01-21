import * as sysCol from "_sys/collections";
import * as col from "collections";
import * as thisCol from "../_collections";
import { Flow, OperationType } from "_sys/classes/Flow";
import { addLineCodeSteps, lineEquipmentParentModelSteps } from "../_utils";
import * as flow_ChangedTower from "../common/flow_ChangedTower";
import * as _utils from "../_utils";
import { addTransformSteps, resFilterSteps } from "scenario/common/_utils";
import * as utils from "_sys/utils";

export const flow = {
  src: __filename,
  input: thisCol.in_РазделениеУчасткаМагистралиКА,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  idSource: "КИСУР",
  pipeline: [
    ...resFilterSteps(),
    ...addTransformSteps([
      {
        $project: {
          "payload.КодСобытия": "$payload.verb",
          "payload.СистемаИсточник": "$payload.source",
          "payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта":
            "$payload.body.element.code",
          "payload.Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта":
            "$payload.body.element.name",
          "payload.Тело.ЭлементСтруктурыСети.ТипОбъекта":
            "$payload.body.element.objecttype",
          "payload.Тело.НаименованиеПользователяСАП":
            "$payload.body.element.exfname",
          "payload.Тело.ЭлементСтруктурыСети.НоминальноеНапряжение":
            "$payload.body.element.basevoltage",
          "payload.Тело.УчастокМагистрали.КодТехническогоОбъекта":
            "$payload.body.segment.code",
          "payload.Тело.ЭлементСтруктурыСети.Опора.КодТехническогоОбъекта":
            "$payload.body.element.pillar.code",
          "payload.Тело.ЭлементСтруктурыСети.соединение к.КодТехническогоОбъекта":
            "$payload.body.element.connect_to.code",
          messageId: "$messageId",
        },
      },
    ]),
    {
      $match: {
        $expr: "$payload.Тело.УчастокМагистрали.КодТехническогоОбъекта",
      },
    },
    {
      $match: {
        $expr:
          "$payload.Тело.ЭлементСтруктурыСети.Опора.КодТехническогоОбъекта",
      },
    },
    {
      $match: {
        $expr:
          "$payload.Тело.ЭлементСтруктурыСети.соединение к.КодТехническогоОбъекта",
      },
    },
    {
      $match: {
        $expr: {
          $ne: ["$payload.Тело.УчастокМагистрали.КодТехническогоОбъекта", ""],
        },
      },
    },
    {
      $addFields: {
        // _id: "$payload.Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
        "payload.Участок":
          "$payload.Тело.УчастокМагистрали.КодТехническогоОбъекта",
        // "payload.isDisconnector": true,
      },
    },
    ...addLineCodeSteps(),
    { $replaceRoot: { newRoot: "$payload" } },
    ...lineEquipmentParentModelSteps(
      "Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
      "processor",
      "Линия",
      "КИСУР"
    ),
    {
      $project: {
        _id: "$Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
        model: {
          "@type": "$Тело.ЭлементСтруктурыСети.ТипОбъекта",
          "@action": "create",
          "@idSource": "processor", // processor а не КИСУР для единообразной обработки вместе с acls
          "@id": "$Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
          IdentifiedObject_name:
            "$Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта",
          // Switch_Tower: {
          //   "@type": "Tower",
          //   "@id":
          //     "$Тело.ЭлементСтруктурыСети.Опора.КодТехническогоОбъекта",
          // },
          Switch_LineSpan: {
            "@type": "LineSpan",
            "@id": {
              $first:
                "$Тело.ЭлементСтруктурыСети.соединение к.КодТехническогоОбъекта",
            },
          },
          Equipment_EquipmentContainer: {
            "@type": "Line",
            "@id": "$Линия",
          },
          IdentifiedObject_ParentObject: "$parentModel",
          // IdentifiedObject_ParentObject: {
          //   "@type": "Line",
          //   "@id": "$Линия",
          // },
          ConductingEquipment_BaseVoltage: {
            "@type": "BaseVoltage",
            "@id": _utils.baseVoltageMap(
              "$Тело.ЭлементСтруктурыСети.НоминальноеНапряжение"
            ),
          },
        },
      },
    },
    {
      $addFields: {
        "model.ConductingEquipment_Terminals": [
          {
            "@type": "Terminal",
            "@id": { $concat: ["Terminal", "$model.@id", "-", "1"] },
            "@idSource": "processor",
            "@action": "create",
            ACDCTerminal_sequenceNumber: { $literal: 1 },
            Terminal_index: { $literal: 1 },
            IdentifiedObject_ParentObject: {
              "@id": "$model.@id",
              "@idSource": "processor",
            },
          },
          {
            "@type": "Terminal",
            "@id": { $concat: ["Terminal", "$model.@id", "-", "2"] },
            "@idSource": "processor",
            "@action": "create",
            ACDCTerminal_sequenceNumber: { $literal: 2 },
            Terminal_index: { $literal: 2 },
            IdentifiedObject_ParentObject: {
              "@id": "$model.@id",
              "@idSource": "processor",
            },
          },
        ],
      },
    },
  ],
};

// utils.compileFlow(flow);
