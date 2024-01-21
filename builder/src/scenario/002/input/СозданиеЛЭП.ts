import { OperationType, Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as common from "../_common";
import { addTransformSteps, resFilterSteps } from "scenario/common/_utils";
export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеЛЭП",
  output: sysCol.model_Input,
  operationType: OperationType.insert,
  idSource: "КИСУР",
  pipeline: [
    ...resFilterSteps(),
    ...addTransformSteps([
      //transformSteps generated code begin
      {
        $project: {
          "payload.КодСобытия": "$payload.verb",
          "payload.СистемаИсточник": "$payload.source",
          "payload.Тело.КодТехническогоОбъекта": "$payload.body.code",
          "payload.Тело.НаименованиеТехнОбъекта": "$payload.body.name",
          "payload.Тело.НаименованиеПользователяСАП": "$payload.body.exfname",
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
    ...common.parentModelSteps(
      "Тело.КодТехническогоОбъекта",
      common.lineFolder("$Тело.РЭС")
    ),
    {
      $project: {
        messageId: "$messageId",
        model: {
          "@type": "Line",
          "@action": "create",
          "@id": "$Тело.КодТехническогоОбъекта",
          IdentifiedObject_name: common.userStatus(
            "$Тело.ПользовательскийСтатус",
            "$Тело.НаименованиеТехнОбъекта"
          ),
          IdentifiedObject_description: {
            $concat: ["ПользовательСАП: ", "$Тело.НаименованиеПользователяСАП"],
          },
          IdentifiedObject_OrganisationRoles: common.orgRole(
            "$Тело.БалансоваяПринадлежность"
          ),
          PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
          EquipmentContainer_PlaceEquipmentContainer: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          IdentifiedObject_ParentObject: "$parentModel",
          Line_Region: common.regionByExtId("$Тело.РЭС"),
        },
      },
    },
  ],
};
