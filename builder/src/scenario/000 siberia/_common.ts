export function addParentTypeStep() {
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
                  regex: "Несогласованная",
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
          ],
          default: "",
        },
      },
    },
  };
}

export function terminalExpr(parentIdExpr: any, num: Number) {
  return {
    "@type": "Terminal",
    "@id": { $concat: [parentIdExpr, "-T", { $toString: num }] },
    "@action": "create",
    ACDCTerminal_sequenceNumber: { $literal: num },
    Terminal_index: { $literal: num },
    IdentifiedObject_ParentObject: {
      "@id": parentIdExpr,
    },
  };
}

export function addTwoTerminalsStep() {
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

export function addTerminalStep() {
  return {
    $addFields: {
      model: {
        ConductingEquipment_Terminals: [terminalExpr("$model.@id", 1)],
      },
    },
  };
}
