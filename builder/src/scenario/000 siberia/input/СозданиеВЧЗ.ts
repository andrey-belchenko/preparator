import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "../_common";

export const flow: Flow = {
    src: __filename,
    input: "in_СозданиеВЧЗ",
    output: sysCol.model_Input,
    idSource: "КИСУР",
    pipeline: [
      {
        $project: {
          model: {
            "@type": "WaveTrap",
            "@action": "create",
            "@id": "$Тело.КодТехническогоОбъекта",
            IdentifiedObject_name: "$Тело.НаименованиеТехнОбъекта",
            PowerSystemResource_ccsCode : "$Тело.КодТехническогоОбъекта",
            Eqipment_nameplate: "$Тело.ТипВЧЗ",
            Equipment_PlaceEquipment: {
              "@type": "TechPlace",
              "@action": "create",
              "@id": {
                $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
              },
              TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
            },
            Equipment_EquipmentContainer: {
              "@type": "VoltageLevel",
              "@id": "$Тело.ВышестоящийОбъектРУ",
            },
            IdentifiedObject_ParentObject: {
              "@type": "VoltageLevel",
              "@id": "$Тело.ВышестоящийОбъектРУ",
            },
          },
        },
      },
    ],
  };