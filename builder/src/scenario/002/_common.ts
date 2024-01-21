import * as sysCol from "_sys/collections";

export function parentModelSteps(extIdPath: string, parentModelExpr: any): any {
  return [
    {
      $lookup: {
        from: sysCol.model_Entities,
        localField: extIdPath,
        foreignField: "extId.КИСУР",
        as: "e",
      },
    },
    {
      $unwind: {
        path: "$e",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        elId: { $concat: ["$e.id", "-", "IdentifiedObject_ParentObject"] },
      },
    },
    {
      $lookup: {
        from: sysCol.model_Links,
        localField: "elId",
        foreignField: "linkId",
        as: "epl",
      },
    },
    {
      $unwind: {
        path: "$epl",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        parentModel: parentModelExpr,
      },
    },
    {
      $addFields: {
        parentModel: {
          $cond: [
            { $eq: ["$parentModel.@id", ""] },
            "$$REMOVE",
            "$parentModel",
          ], // появились объекты с пустым родителем в примерах
        },
      },
    },
    {
      $addFields: {
        parentModel: {
          $cond: [
            { $eq: ["$epl.lastSource", "sk11"] },
            "$$REMOVE",
            "$parentModel",
          ],
        },
      },
    },
    { $unset: ["e", "elId", "epl"] },
  ];
}

export function parentTypeStep() {
  return {
    $addFields: {
      type: {
        $switch: {
          branches: [
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Предохранитель",
                },
              },
              then: "Fuse",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Fuse",
                },
              },
              then: "Fuse",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Заземляющий",
                },
              },
              then: "GroundDisconnector",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Разъединитель",
                },
              },
              then: "Disconnector",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Disconnector",
                },
              },
              then: "Disconnector",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Выключатель",
                },
              },
              then: "Breaker",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "ЛЭП04",
                },
              },
              then: "NonConformLoad",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Трансформатор тока",
                },
              },
              then: "CurrentTransformer",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Трансформатор напряжения",
                },
              },
              then: "PotentialTransformer",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "Bay",
                },
              },
              then: "Bay",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "BusbarSection",
                },
              },
              then: "BusbarSection",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "РУ",
                },
              },
              then: "VoltageLevel",
            },
            {
              case: {
                $regexMatch: {
                  input: "$Тело.КлассВышестоящегоОбъекта",
                  regex: "PowerTransformer",
                },
              },
              then: "PowerTransformer",
            },
          ],
          default: "",
        },
      },
    },
  };
}

export function terminalExpr(
  parentIdExpr: any,
  num: Number,
  extraProps: any = {}
) {
  return {
    "@type": "Terminal",
    "@id": { $concat: [parentIdExpr, "-T", { $toString: num }] },
    "@action": "create",
    ACDCTerminal_sequenceNumber: { $literal: num },
    Terminal_index: { $literal: num },
    IdentifiedObject_ParentObject: {
      "@id": parentIdExpr,
    },
    ...extraProps,
  };
}

export function twoTerminalsStep() {
  return {
    $addFields: {
      model: {
        ConductingEquipment_Terminals: [
          terminalExpr("$model.@id", 1),
          terminalExpr("$model.@id", 2),
        ],
      },
    },
  };
}

export function terminalStep() {
  return {
    $addFields: {
      model: {
        ConductingEquipment_Terminals: [terminalExpr("$model.@id", 1)],
      },
    },
  };
}

export function terminalStepIf(cond: any) {
  return {
    $addFields: {
      model: {
        ConductingEquipment_Terminals: {
          $cond: [cond, [terminalExpr("$model.@id", 1)], "$$REMOVE"],
        },
      },
    },
  };
}

export function regionByExtId(regionExtIdExpr: string) {
  return {
    "@type": "SubGeographicalRegion",
    "@idSource": "КИСУР",
    "@id": {
      $concat: ["SubGeographicalRegion", regionExtIdExpr],
    },
  };
}

export function lineFolder(regionExtIdExpr: string) {
  return {
    "@idSource": "КИСУР",
    "@type": "Folder",
    "@action": "create",
    "@id": {
      $concat: ["LineFolder", regionExtIdExpr],
    },
    IdentifiedObject_name: " Новые линии",
    IdentifiedObject_ParentObject: regionByExtId(regionExtIdExpr),
  };
}

export function substationFolder(regionExtIdExpr: string) {
  return {
    "@idSource": "КИСУР",
    "@type": "Folder",
    "@action": "create",
    "@id": {
      $concat: ["SubstationFolder", regionExtIdExpr],
    },
    IdentifiedObject_name: " Новые подстанции",
    IdentifiedObject_ParentObject: regionByExtId(regionExtIdExpr),
  };
}


export function userStatus(userStatus: string, objName: string) {
  return {

    $concat: [objName, { $ifNull: [{ $concat: [" (", userStatus, ")"] }, ""] }],

  };
}

export function orgRole(balanceRelation: string) {
  return {
    "@idSource": "platform",
    "@type": "OrganisationRole",
    "@action": "create",
    "@id": {
      $cond: {
        if: { $eq: [balanceRelation, "CONSUMER"] },
        then: "92b025e1-1036-4e38-9c3e-3b73c345d1a0",
        // id экземпляра класса OrganisationRole в СК-11
        // Дерево управления и ведения --> Абонент --> Баланс Абонент
        else: "c6ea45dd-2164-45f9-94ff-4c00d23b5fbb",
        // id экземпляра класса OrganisationRole в СК-11
        // Дерево управления и ведения --> ПАО "Россети Центр" - "Воронежэнерго" --> Баланс Воронежэнерго
      },
    },
  };
}

export function transformerType(type: string) {
  return {
    $cond: {
      if: { $eq: [type, "Трансформатор"] },
      then: {
        "@idSource": "platform",
        "@type": "PSRType",
        "@action": "create",
        "@id": "10000d24-0000-0000-c000-0000006d746c",
      },
      else: "$$REMOVE",
    },
  };
}

export function breakerType(type: string) {
  return {
    $cond: {
      if: { $eq: [type, "Автоматический выключатель"] },
      then: {
        "@idSource": "platform",
        "@type": "PSRType",
        "@action": "create",
        "@id": "10000cf1-0000-0000-c000-0000006d746c",
      },
      else: "$$REMOVE",
    },
  };
}

export function disconnectorType(type: string) {
  return {
    $cond: {
      if: { $eq: [type, "Разъединитель"] },
      then: {
        "@idSource": "platform",
        "@type": "PSRType",
        "@action": "create",
        "@id": "10000cd2-0000-0000-c000-0000006d746c",
      },
      else: "$$REMOVE",
    },
  };
}



export function connectionKindMap(fieldName: string) {
  const branch = (input: string, output: string) => {
    return {
      case: { $eq: [fieldName, input] },
      then: {
        "@idSource": "platform",
        "@type": "WindingConnection",
        "@id": "cim:WindingConnection." + output,
      },
    };
  };
  return {
    $switch: {
      branches: [
        branch("УН", "Yn"),
        branch("ZH", "Zn"),
        branch("ZН", "Zn"),
        branch("Д", "D"),
        branch("У", "Y"),
      ],
      default: "$$REMOVE",
    },
  };
}

  export function dispNames (objTechPlace: string) {
    return {
      $addFields: {
        dispName: {
          $switch: {
            branches: [
              {
                case: {
                  $regexMatch: {
                    input: objTechPlace,
                    regex: "Предохранитель",
                  },
                },
                then: "Fuse",
              },
              {
                case: {
                  $regexMatch: {
                    input: "$Тело.КлассВышестоящегоОбъекта",
                    regex: "Fuse",
                  },
                },
                then: "Fuse",
              },
            ],
            default: "",
          },
        },
      },
    };
  };

  // {
    // $cond: {
      // if: { $regexMatch: {input: "$payload.Тело.КодТехническогоОбъекта" , regex:"^[^0-9][^0-9][0-9]+-[0-9]+-[0-9][0-9]$"}},
      // then: {
        // $substr: ["$payload.Тело.КодТехническогоОбъекта","-1",1]
        //$substr: [
          // "$payload.Тело.КодТехническогоОбъекта", 
          // { $subtract: [ { $strLenCP: "$payload.Тело.КодТехническогоОбъекта" }, 1 ] }, // Начинаем с индекса (длина строки - 1)
          // 1  // Извлекаем один символ
      // ]},
      // },
      // else: "0" // todo: продумать логику, которая будет бросать предупреждение в соотв. коллекцию 
    // } 
  // }