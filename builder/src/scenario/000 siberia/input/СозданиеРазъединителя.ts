import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "./../_common";

export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеРазъединителя",
  output: sysCol.model_Input,
  idSource: "КИСУР",
  pipeline: [
    { $replaceRoot: { newRoot: "$payload" } },
    _common.addParentTypeStep(),
    {
      $project: {
        model: {
          "@type": "Disconnector",
          "@action": "create",
          "@id": "$Тело.КодТехническогоОбъекта",
          IdentifiedObject_name: "$Тело.НаименованиеТехнОбъекта",
          PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
          Equipment_normallyInService: {
            $eq: ["$Тело.НормальноВРаботе", "да"],
          },
          Equipment_PlaceEquipment: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: [
                "TechPlace",
                "$Тело.КодТехническогоОбъекта",
              ],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          Equipment_EquipmentContainer: {
            "@type": "$type",
            "@id": {
              $cond: { 
                if: { $eq: ["$Тело.КлассВышестоящегоОбъекта", "BusbarSection"] }, 
                then: "$Тело.ВышестоящийОбъект",
                else: "$Тело.ВышестоящийОбъект",
              },
            },
          },
          IdentifiedObject_ParentObject: {
            "@type": "$type",
            "@id": "$Тело.ВышестоящийОбъект",
          },
          IdentifiedObject_OriginalParentObject: {
            "@type": "$type",
            "@id": "$Тело.ВышестоящийОбъект",
          },
        },
      },
    },
    _common.addTwoTerminalsStep()
  ],
};
