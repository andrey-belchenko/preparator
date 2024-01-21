import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as thisCol from "./_collections";
import { Pipeline } from "_sys/classes/Pipeline";
import * as _utils from "../_utils";

function countSubstation(field) {
  return {
    $size: {
      $filter: {
        input: "$Тело.ЭлементСтруктурыСети.Соединения",
        as: "it",
        cond: {
          $regexMatch: {
            input: "$$it." + field,
            regex: "^(PS|TP|RP)[0-9-]*$",
          },
        },
      },
    },
  };
}

export const flow: Flow = {
  src: __filename,
  input: thisCol.flow_Сегмент,
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  idSource: "КИСУР",
  pipeline: new Pipeline()
    .replaceRoot("$payload")
    .addFields({
      НачОпора: {
        $arrayElemAt: ["$Тело.ЭлементСтруктурыСети.Нач_Кон_Опоры", 0],
      },
      КонОпора: {
        $arrayElemAt: ["$Тело.ЭлементСтруктурыСети.Нач_Кон_Опоры", 1],
      },
      // Кривая логика, чтобы определить подключены ли концы участка к подстанциям (на таком варианте остановились с ТехКонсур, чтобы не переделывать формат сообщений). По хорошему нужно проверять наличие соединения по каждому LineSpan вместо этого. Используется для установки признака LineSpan.isDangling
      countStartSubstation: countSubstation("Соединение от"),
      countEndSubstation: countSubstation("Соединение к"),
    })
    .project({
      model: {
        "@type": "AccountPartLine",
        "@action": "create",
        "@id": "$Тело.ЭлементСтруктурыСети.КодТехническогоОбъекта",
        IdentifiedObject_name:
          "$Тело.ЭлементСтруктурыСети.НаименованиеТехнОбъекта",
        AccountPartLine_isTap: "$Отпайка",
        AccountPartLine_FirstTower: {
          $cond: [
            "$НачОпора.КодТехническогоОбъекта",
            {
              "@type": "Tower",
              "@id": "$НачОпора.КодТехническогоОбъекта",
            },
            "$$REMOVE",
          ],
        },
        AccountPartLine_LastTower: {
          $cond: [
            "$КонОпора.КодТехническогоОбъекта",
            {
              "@type": "Tower",
              "@id": "$КонОпора.КодТехническогоОбъекта",
            },
            "$$REMOVE",
          ],
        },
        AccountPartLine_Line: {
          "@type": "Line",
          "@id": "$Линия",
        },
        IdentifiedObject_ParentObject: {
          "@type": "Line",
          "@id": "$Линия",
        },
        AccountPartLine_BaseVoltage: {
          "@type": "BaseVoltage",
          "@id": _utils.baseVoltageMap("$Тело.ЭлементСтруктурыСети.НоминальноеНапряжение"),
        },
        AccountPartLine_isFromSubstation: {
          $gt: ["$countStartSubstation", 0],
        },
        AccountPartLine_isToSubstation: {
          $gt: ["$countEndSubstation", 0],
        },
      },
    })
    .build(),
};

// import * as utils from "_sys/utils";

// utils.compileFlow(flow)
