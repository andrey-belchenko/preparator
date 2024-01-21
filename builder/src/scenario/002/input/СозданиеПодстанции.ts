import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as utils from "_sys/utils";
import * as common from "../_common";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";
export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеПодстанции",
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
          "payload.Тело.ПрисоединениеПитающийЦентр":
            "$payload.body.con_supplycenter",
          "payload.Тело.НаименованиеПитающегоЦентра":
            "$payload.body.name_supplycenter",
          "payload.Тело.РЭС": "$payload.body.res",
          "payload.Тело.ПитающийЦентр": "$payload.body.issupplycenter",
          "payload.Тело.ПитающаяЛЭП": "$payload.body.con_supplylep",
          "payload.Тело.НаименованиеПитающейЛЭП":
            "$payload.body.name_supplylep",
          "payload.Тело.БалансоваяПринадлежность": "$payload.body.balance_sign",
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
    {
      $addFields: {
        Description: {
          $switch: {
            branches: [
              {
                case: {
                  $regexMatch: {
                    input: "$Тело.НаименованиеТехнОбъекта",
                    regex: "ТП",
                  },
                },
                then: {
                  $concat: [
                    "ЛЭП: ",
                    "$Тело.ПитающаяЛЭП",
                    ", ",
                    "РЭС: ",
                    "$Тело.РЭС",
                    ", ",
                    "ПС: ",
                    "$Тело.ПрисоединениеПитающийЦентр",
                    ", ",
                    "ПользовательСАП: ",
                    "$Тело.НаименованиеПользователяСАП",
                  ],
                },
              },
              {
                case: {
                  $regexMatch: {
                    input: "$Тело.НаименованиеТехнОбъекта",
                    regex: "ПС",
                  },
                },
                then: {
                  $concat: [
                    "ПользовательСАП: ",
                    "$Тело.НаименованиеПользователяСАП",
                  ],
                },
              },
            ],
            default: "",
          },
        },
      },
    },
    ...common.parentModelSteps(
      "Тело.КодТехническогоОбъекта",
      common.substationFolder("$Тело.РЭС")
    ),
    {
      $project: {
        messageId: "$messageId",
        model: {
          "@type": "Substation",
          "@action": "create",
          "@id": "$Тело.КодТехническогоОбъекта",
          IdentifiedObject_name: common.userStatus(
            "$Тело.ПользовательскийСтатус",
            "$Тело.НаименованиеТехнОбъекта"
          ),
          IdentifiedObject_description: "$Description",
          PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
          Substation_isSupplyCenter: {
            $in: ["$Тело.ПитающийЦентр", ["да","true"]],
          },
          IdentifiedObject_OrganisationRoles: common.orgRole(
            "$Тело.БалансоваяПринадлежность"
          ),

          EquipmentContainer_PlaceEquipmentContainer: {
            "@type": "TechPlace",
            "@action": "create",
            "@id": {
              $concat: ["TechPlace", "$Тело.КодТехническогоОбъекта"],
            },
            TechPlace_CodeTP: "$Тело.КодТехническогоОбъекта",
          },
          Substation_Region: common.regionByExtId("$Тело.РЭС"),
          IdentifiedObject_ParentObject: "$parentModel",
          Substation_supplyCenterCode:"$Тело.ПрисоединениеПитающийЦентр"
        },
      },
    },
  ],
};

// utils.compileFlow(flow)
