import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "./../_common";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеТрансформатораНапряжения",
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
          "payload.Тело.ВышестоящийОбъект": "$payload.body.fuse",
          "payload.Тело.КлассВышестоящегоОбъекта":
            "$payload.body.higher_obj_class",
          "payload.Тело.БалансоваяПринадлежность": "$payload.body.balance_sign",
          "payload.Тело.ПользовательскийСтатус": "$payload.body.user_stat",
          "payload.Тело.РЭС": "$payload.body.res",
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
          "@type": "PotentialTransformer",
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
          Equipment_PlaceEquipment: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          IdentifiedObject_ParentObject: "$parentModel",
        },
      },
    },
  ],
};
