import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "./../_common";
import * as utils from "_sys/utils";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеСШ",
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
          "payload.Тело.НаименованиеТехнОбъекта": "$payload.body.name",
          "payload.Тело.НаименованиеПользователяСАП": "$payload.body.exfname",
          "payload.Тело.НоминальноеНапряжение": "$payload.body.voltage",
          "payload.Тело.ВышестоящийОбъектРУ": "$payload.body.ru",
          "payload.Тело.НормальноВРаботе": "$payload.body.atwork",
          "payload.Тело.БалансоваяПринадлежность": "$payload.body.balance_sign",
          "payload.Тело.ПользовательскийСтатус": "$payload.body.user_stat",
          "payload.Тело.ВспомогательноеОборудования":
            "$payload.body.support_equipment",
          "payload.Тело.Фиктивная": "$payload.body.dummy",
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
    ..._common.parentModelSteps("Тело.КодТехническогоОбъекта", {
      "@type": "VoltageLevel",
      "@id": "$Тело.ВышестоящийОбъектРУ",
    }),
    {
      $project: {
        messageId: "$messageId",
        model: {
          "@type": "BusbarSection",
          "@action": "create",
          "@id": "$Тело.КодТехническогоОбъекта",
          IdentifiedObject_name: _common.userStatus(
            "$Тело.ПользовательскийСтатус",
            "$Тело.НаименованиеТехнОбъекта"
          ),
          IdentifiedObject_OrganisationRoles: _common.orgRole(
            "$Тело.БалансоваяПринадлежность"
          ),
          IdentifiedObject_description: {
            $concat: ["ПользовательСАП: ", "$Тело.НаименованиеПользователяСАП"],
          },
          PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
          BusbarSection_isFake: {
            $in: ["$Тело.Фиктивная", ["да", "true"]],
          },
          Equipment_normallyInService: {
            $in: ["$Тело.НормальноВРаботе", ["да", "true"]],
          },
          Equipment_PlaceEquipment: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          IdentifiedObject_ParentObject: "$parentModel",
                    // TODO: хардкод, переделать
          ConductingEquipment_ControlArea: {
            "@idSource": "platform",
            "@id": "9c296047-f9d5-4d34-8b26-84522e2f4884",
            "@action": "create",
            "@type":"ControlArea"
          },
          ConductingEquipment_BaseVoltage: {
            "@type": "BaseVoltage",
            "@id": {
              $concat: ["BaseVoltage", "$Тело.НоминальноеНапряжение"],
            },
          },
          Equipment_EquipmentContainer: "$parentModel",
        },
      },
    },
    _common.terminalStepIf({ $not: "$model.BusbarSection_isFake" }),
  ],
};

// utils.compileFlow(flow)
