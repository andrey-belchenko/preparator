import { Flow, OperationType } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as utils from "_sys/utils";
export const flows: Flow[] = [
  {
    src: __filename,
    input: "in_СозданиеЯчейки_Тест",
    output: sysCol.model_Input,
    operationType: OperationType.insert,
    idSource: "КИСУР",
    pipeline: [
      { $replaceRoot: { newRoot: "$payload" } },
      {
        $lookup: {
          from: "dm_VoltageLevel",
          localField: "Тело.ВышестоящийОбъект",
          foreignField: "extId.КИСУР",
          as: "vl",
        },
      },
      {
        $unwind: "$vl",
      },
      {
        $lookup: {
          from: "dm_Substation",
          localField: "vl.model.VoltageLevel_Substation",
          foreignField: "id",
          as: "st",
        },
      },
      {
        $unwind: "$st",
      },
      {
        $lookup: {
          from: "dm_SubGeographicalRegion",
          localField: "st.model.Substation_Region",
          foreignField: "id",
          as: "gr",
        },
      },
      {
        $unwind: "$gr",
      },
      {
        $project: {
          model: {
            "@type": "Bay",
            "@action": "create",
            "@id": "$Тело.КодТехническогоОбъекта",
            IdentifiedObject_name: {
              // просто для примера добавляем к имени ячейки регион и подстанцию
              $concat: [
                "$gr.model.IdentifiedObject_name",
                ". ",
                "$st.model.IdentifiedObject_name",
                ". ",
                "$Тело.НаименованиеТехнОбъекта",
              ],
            },
            PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
            EquipmentContainer_PlaceEquipmentContainer: {
              "@type": "TechPlace",
              "@action": "create",
              "@id": {
                $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
              },
              TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
            },
            IdentifiedObject_ParentObject: {
              "@type": "VoltageLevel",
              "@id": "$Тело.ВышестоящийОбъект",
            },
          },
        },
      },
    ],
  },
  {
    src: __filename,
    input: "dm_Bay",
    operationType: OperationType.insert,
    output: "out_Bus",
    pipeline: [
      {
        $project: {
          _id: false,
          queueName: "EQUIPMENT.ASTU.IN",
          payload: {
            КодСобытия: "СозданиеЯчейки",
            ДатаФормированияСообщения: "$$NOW",
            СистемаИсточник: "ЕИП",
            Тело: {
              КодТехническогоОбъекта: "$extId.КИСУР",
              НаименованиеТехнОбъекта: "$model.IdentifiedObject_name",
            },
          },
        },
      },
    ],
  },
];
// utils.compileFlow(flow)
