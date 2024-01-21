import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as _common from "./../_common";
import { addTransformSteps, filterSteps } from "scenario/common/_utils";

export const flow: Flow = {
  src: __filename,
  input: "in_СозданиеТрансформатора",
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
          "payload.Тело.МаркаТрансформатора": "$payload.body.type",
          "payload.Тело.НоминальнаяМощностьТрансформатора":
            "$payload.body.power",
          "payload.Тело.ТрансформаторСобственныхНужд": "$payload.body.tsn",
          "payload.Тело.НормальноВРаботе": "$payload.body.atwork",
          "payload.Тело.НапряжениеОбмоткиВН": "$payload.body.voltage_high",
          "payload.Тело.НапряжениеОбмотки_2": "$payload.body.voltage_mid",
          "payload.Тело.НапряжениеОбмоткиНН": "$payload.body.voltage_low",
          "payload.Тело.ВышестоящийОбъектПодстанция":
            "$payload.body.substation",
          "payload.Тело.БалансоваяПринадлежность": "$payload.body.balance_sign",
          "payload.Тело.схема соединения обмоток 1":
            "$payload.body.winding_scheme_conn1",
          "payload.Тело.схема соединения обмоток 2":
            "$payload.body.winding_scheme_conn2",
          "payload.Тело.схема соединения обмоток 3":
            "$payload.body.winding_scheme_conn3",
          "payload.Тело.ГруппаСоедОбмоток_2":
            "$payload.body.winding_group_conn2",
          "payload.Тело.ГруппаСоедОбмоток_3":
            "$payload.body.winding_group_conn3",
          "payload.Тело.ТокХХ": "$payload.body.current_xx",
          "payload.Тело.ПотериХХ": "$payload.body.loss_xx",
          "payload.Тело.НапряжениеКЗ_1": "$payload.body.voltage_kz1",
          "payload.Тело.НапряжениеКЗ_2": "$payload.body.voltage_kz2",
          "payload.Тело.НапряжениеКЗ_3": "$payload.body.voltage_kz3",
          "payload.Тело.ПотериКЗ_2": "$payload.body.loss_kz2",
          "payload.Тело.ПользовательскийСтатус": "$payload.body.user_stat",
          "payload.Тело.ТипРегулирующегоУстройства":"$payload.body.regulating_device_type",
          "payload.Тело.Разрядники": {
            $map: {
              input: "$payload.body.surge_arrester",
              as: "it",
              in: {
                КодТехническогоОбъекта: "$$it.code",
                НаименованиеТехнОбъекта: "$$it.name",
              },
            },
          },
          "payload.Тело.КлассТрансформатора": "$payload.body.class",
          "payload.Тело.НоминальнаяМощностьОбмотки":
            "$payload.body.winding_rated_power",
          messageId: "$messageId",
        },
      },
      //transformSteps generated code end
    ]),
    {
      $addFields: {
        charactersArray: {
          $split: ["$payload.Тело.КодТехническогоОбъекта", "-"]
        },
        arraySize: {
          $size: {
            $split: ["$payload.Тело.КодТехническогоОбъекта", "-"]
          }
        },
      }
    },
    {
      $addFields: {
        "payload.messageId": "$messageId",
        "payload.ratedU_low_corrected": {
          $replaceOne: {
            input: "$payload.Тело.НапряжениеОбмоткиНН", // Поле, в котором нужно выполнить замену
            find: ",",       // Подстрока, которую нужно найти и заменить
            replacement: "." // Подстрока, на которую нужно заменить найденные значения
          }
        },
        
                // "payload.str_tech_place_length": { $strLenCP: "$payload.Тело.КодТехническогоОбъекта" }, // Длина строки кода ТМ
        "payload.disp_obj_name": { // добавление к имени трансформатора
          $concat: [               // последней цифры из его кода техническго места
            "Т-",
            {
              $arrayElemAt: ["$charactersArray", {$add: ["$arraySize", -1]}]
            }
             // Результат, если ни одна из ветвей не соответствует
          ]        
        }
      },
    },
    { $replaceRoot: { newRoot: "$payload" } },
    ..._common.parentModelSteps("Тело.КодТехническогоОбъекта", {
      "@type": "Substation",
      "@id": "$Тело.ВышестоящийОбъектПодстанция",
    }),
    {
      $project: {
        messageId: "$messageId",
        model: [
          {
            "@type": "PowerTransformer",
            "@action": "create",
            "@id": "$Тело.КодТехническогоОбъекта",
            IdentifiedObject_name: _common.userStatus(
              "$Тело.ПользовательскийСтатус",
              "$disp_obj_name"
            ),
            IdentifiedObject_OrganisationRoles: _common.orgRole(
              "$Тело.БалансоваяПринадлежность"
            ),
            IdentifiedObject_description: {
              $concat: [
                "ПользовательСАП: ",
                "$Тело.НаименованиеПользователяСАП",
              ],
            },
            PowerSystemResource_ccsCode: "$Тело.КодТехническогоОбъекта",
            PowerSystemResource_PSRType: _common.transformerType(
              "$Тело.МаркаТрансформатора"
            ),
            Equipment_normallyInService: {
              $in: ["$Тело.НормальноВРаботе", ["да", "true"]],
            },
            PowerTransformer_isStationSupply: {
              $in: ["$Тело.ТрансформаторСобственныхНужд", ["нет", "false"]],
            },
            Equipment_nameplate: "$Тело.НаименованиеТехнОбъекта",
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
              PowerTransformer_PowerTransformerEnd: [
              {
                "@type": "PowerTransformerEnd",
                "@action": "create",
                "@id": {
                  $concat: [
                    "PowerTransformerEndH",
                    "$Тело.КодТехническогоОбъекта",
                  ],
                },
                PowerTransformerEnd_connectionKind: _common.connectionKindMap(
                  "$Тело.схема соединения обмоток 1"
                ),
                PowerTransformerEnd_ratedS: { 
                  // перевод единиц измерения из кВА в МВА
                  $multiply: [ "$Тело.НоминальнаяМощностьОбмотки", 0.001 ] 
                },
                PowerTransformerEnd_ratedU: {
                  $convert: {
                    input: "$Тело.НапряжениеОбмоткиВН", // Поле, которое нужно преобразовать
                    to: "double", // Целевой тип (double - для "float")
                    onError: -1, // Значение по умолчанию в случае ошибки преобразования
                    onNull: 0, // Значение по умолчанию, если исходное значение null или отсутствует
                  },
                },
                TransformerEnd_BaseVoltage: {
                  "@type": "BaseVoltage",
                  "@id": {
                    $concat: [
                      "BaseVoltage",
                      "$Тело.НапряжениеОбмоткиВН",
                      " кВ",
                    ],
                  },
                },
                
                IdentifiedObject_name: "ВН",
                IdentifiedObject_ParentObject: {
                  "@type": "PowerTransformer",
                  "@id": "$Тело.КодТехническогоОбъекта",
                },
                PowerTransformerEnd_PowerTransformer: {
                  "@type": "PowerTransformer",
                  "@id": "$Тело.КодТехническогоОбъекта",
                },
                /* PowerTransformerEnd_ratedS: {
                  "@type": "ApparentPower",
                  "@action": "create",
                  "@id": {
                    $concat: [
                      "ApparentPower",
                      "$Тело.НоминальнаяМощностьТрансформатора",
                    ],
                  },
                  ApparentPower_value:
                    "$Тело.НоминальнаяМощностьТрансформатора",
                },*/
                TransformerEnd_endNumber: 1,
                TransformerEnd_Terminal: _common.terminalExpr(
                  {
                    $concat: [
                      "PowerTransformerEndH",
                      "$Тело.КодТехническогоОбъекта",
                    ],
                  },
                  1,
                  {
                    Terminal_ConductingEquipment: {
                      "@id": "$Тело.КодТехническогоОбъекта",
                    },
                  }
                ),
              },

              {
                "@type": "PowerTransformerEnd",
                "@action": "create",
                "@id": {
                  $concat: [
                    "PowerTransformerEndL",
                    "$Тело.КодТехническогоОбъекта",
                  ],
                },
                PowerTransformerEnd_connectionKind: _common.connectionKindMap(
                  "$Тело.схема соединения обмоток 2"
                ),
                PowerTransformerEnd_phaseAngleClock:
                  "$Тело.ГруппаСоедОбмоток_2",
                PowerTransformerEnd_ratedS: { 
                  // перевод единиц измерения из кВА в МВА
                  $multiply: [ "$Тело.НоминальнаяМощностьОбмотки", 0.001 ] 
                },
                PowerTransformerEnd_ratedU: {
                  $convert: {
                    input: "$ratedU_low_corrected",
                     // Поле, которое нужно преобразовать
                    to: "double", // Целевой тип (double - для "float")
                    onError: -1, // Значение по умолчанию в случае ошибки преобразования
                    onNull: 0, // Значение по умолчанию, если исходное значение null или отсутствует
                    },
                  },
                TransformerEnd_BaseVoltage: {
                  "@type": "BaseVoltage",
                  "@id": {
                    $concat: [
                      "BaseVoltage",
                      "$Тело.НапряжениеОбмоткиНН",
                      " кВ",
                    ], // Todo
                  },
                },
                IdentifiedObject_name: "НН",
                IdentifiedObject_ParentObject: {
                  "@type": "PowerTransformer",
                  "@id": "$Тело.КодТехническогоОбъекта",
                },
                PowerTransformerEnd_PowerTransformer: {
                  "@type": "PowerTransformer",
                  "@id": "$Тело.КодТехническогоОбъекта",
                },

                /*PowerTransformerEnd_ratedS: {
                  "@type": "ApparentPower",
                  "@action": "create",
                  "@id": {
                    $concat: [
                      "ApparentPower",
                      "$Тело.НоминальнаяМощностьТрансформатора",
                    ],
                  },
                  ApparentPower_value:
                    "$Тело.НоминальнаяМощностьТрансформатора",
                },*/
                TransformerEnd_endNumber: 2,
                TransformerEnd_Terminal: _common.terminalExpr(
                  {
                    $concat: [
                      "PowerTransformerEndL",
                      "$Тело.КодТехническогоОбъекта",
                    ],
                  },
                  2,
                  {
                    Terminal_ConductingEquipment: {
                      "@id": "$Тело.КодТехническогоОбъекта",
                    },
                  }
                ),
              },
            ],
          },
          {
            "@type": "NoLoadTestME",
            "@action": "create",
            "@id": {
              $concat: ["NoLoadTestME", "$Тело.КодТехническогоОбъекта"],
            },
            IdentifiedObject_name: "Опыт ХХ",
            NoLoadTestME_excitingCurrent: "$Тело.ТокХХ",
            NoLoadTestME_loss: { $round: ["$Тело.ПотериХХ", 3] }, // округление чтобы было схождение после смена формата сообщений при проверке от КИСУР приходит  3.8000000000000003 от шины 3.8
            NoLoadTestME_EnergisedEnd: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndH",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
            IdentifiedObject_ParentObject: {
              "@type": "PowerTransformer",
              "@id": "$Тело.КодТехническогоОбъекта",
            },
          },
          {
            "@type": "ShortCircuitTestME",
            "@action": "create",
            "@id": {
              $concat: ["ShortCircuitTestME", "$Тело.КодТехническогоОбъекта"],
            },
            IdentifiedObject_name: "Опыт КЗ 1-2",
            ShortCircuitTestME_shortCircuitVoltage: "$Тело.НапряжениеКЗ_2",
            ShortCircuitTestME_loss: { $round: ["$Тело.ПотериКЗ_2", 3] },
            ShortCircuitTestME_EnergisedEnd: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndH",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
            ShortCircuitTestME_GroundedEnds: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndL",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
            IdentifiedObject_ParentObject: {
              "@type": "PowerTransformer",
              "@id": "$Тело.КодТехническогоОбъекта",
            },
          },
          // Экземпляр TransformerMeshImpedance захардкоден
          // решения лучше пока что нет 
          {
            "@type": "TransformerMeshImpedance",
            "@action": "create",
            "@id": {
              $concat: [
                "TransformerMeshImpedance",
                "$Тело.КодТехническогоОбъекта",
              ],
            },
            IdentifiedObject_name: "Сопротивление 1-2", 
            IdentifiedObject_ParentObject: {
              "@type": "PowerTransformer",
              "@id": "$Тело.КодТехническогоОбъекта",
            },
            TransformerMeshImpedance_r: 1e-38,
            TransformerMeshImpedance_x: 1e-38,
            TransformerMeshImpedance_FromTransformerEnd: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndH",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
            TransformerMeshImpedance_ToTransformerEnd: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndL",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
          },
          {
            "@type": "RatioTapChanger",
            "@action": "create",
            "@id": {
              $concat: [
                "RatioTapChanger",
                "$Тело.КодТехническогоОбъекта",
              ],
            },
            IdentifiedObject_name: "$Тело.ТипРегулирующегоУстройства",
            IdentifiedObject_ParentObject: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndH",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
            RatioTapChanger_TransformerEnd: {
              "@type": "PowerTransformerEnd",
              "@id": {
                $concat: [
                  "PowerTransformerEndH",
                  "$Тело.КодТехническогоОбъекта",
                ],
              },
            },
          }
        ],
      },
    },
  ],
};
