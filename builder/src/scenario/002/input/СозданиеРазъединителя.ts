import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "./../_common";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеРазъединителя",
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
          "payload.Тело.ВышестоящийОбъект": "$payload.body.cell",
          "payload.Тело.НормальноВРаботе": "$payload.body.atwork",
          "payload.Тело.КлассВышестоящегоОбъекта":
            "$payload.body.higher_obj_class",
          "payload.Тело.БалансоваяПринадлежность": "$payload.body.balance_sign",
          "payload.Тело.ТипРазъединителя": "$payload.body.type",
          "payload.Тело.НоминальныйТок": "$payload.body.rated_current",
          "payload.Тело.ПользовательскийСтатус": "$payload.body.user_stat",
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
    _common.parentTypeStep(),
    ..._common.parentModelSteps("Тело.КодТехническогоОбъекта", {
      "@type": "$type",
      "@id": "$Тело.ВышестоящийОбъект",
    }),
    {
      $project: {
        messageId: "$messageId",
        model: {
          "@type": "Disconnector",
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
          Switch_ratedCurrent: { 
            // перевод единиц измерения из кА в А
            $multiply: [ "$Тело.НоминальныйТок", 1000 ] 
          },
          PowerSystemResource_PSRType: _common.disconnectorType(
            "$Тело.ТипРазъединителя"
          ),
          PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
          Equipment_normallyInService: {
            $in: ["$Тело.НормальноВРаботе", ["да","true"]],
          },
          ConductingEquipment_BaseVoltage: {
            "@type": "BaseVoltage",
            "@id": {
              $concat: ["BaseVoltage", "$Тело.НоминальноеНапряжение"],
            },
          },
          Equipment_PlaceEquipment: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          Equipment_EquipmentContainer: "$parentModel",
          IdentifiedObject_ParentObject: "$parentModel",
          IdentifiedObject_OriginalParentObject: {
            "@type": "$type",
            "@id": "$Тело.ВышестоящийОбъект",
          },
                    // TODO: хардкод, переделать
          ConductingEquipment_ControlArea: {
            "@idSource": "platform",
            "@id": "9c296047-f9d5-4d34-8b26-84522e2f4884",
            "@action": "create",
            "@type":"ControlArea"
          },
        },
      },
    },
    _common.twoTerminalsStep(),
  ],
};
