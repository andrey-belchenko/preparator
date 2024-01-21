import { Pipeline } from "_sys/classes/Pipeline";

export const newObjFolderPrefix = "FolderNewObj";
export const changedObjFolderPrefix = "FolderChangedObj";

export function lineEquipmentParentModelSteps(
  idField: string,
  idSource: string,
  parentIdField: string,
  parentIdSource: string
) {
  let lookupLineSteps: any[] = [];

  if (parentIdSource == "platform") {
    lookupLineSteps = [
      {
        $lookup: {
          from: "dm_Line",
          localField: parentIdField,
          foreignField: "id",
          as: "@l",
        },
      },
      { $unwind: "$@l" },
    ];
    parentIdField = "@l.extId.КИСУР";
    parentIdSource = "КИСУР";
  }

  let foreignField = "extId." + idSource;
  return [
    ...lookupLineSteps,
    {
      $lookup: {
        from: "model_Entities",
        localField: idField,
        foreignField: foreignField,
        as: "@e",
      },
    },
    { $unwind: { path: "$@e", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        parentModel: {
          "@type": "Folder",
          "@action": "create",
          "@idSource": "processor",
          "@id": {
            $concat: [
              {
                $cond: [
                  "$@e.attr.skLoadedAt",
                  "FolderChangedObj",
                  "FolderNewObj",
                ],
              },
              "$" + parentIdField,
            ],
          },
          IdentifiedObject_name: {
            $cond: [
              "$@e.attr.skLoadedAt",
              "Измененные объекты",
              "Новые объекты",
            ],
          },
          IdentifiedObject_ParentObject: {
            "@type": "Line",
            "@idSource": parentIdSource,
            "@id": "$" + parentIdField,
          },
        },
      },
    },
    { $unset: ["@e", "@l"] },
  ];
}

export function addLineCodeSteps(): any {
  return [
    // todo косвенный способ, нужно добавить указание на линию в сразу в сообщении
    {
      $addFields: { codeArray: { $split: ["$payload.Участок", "-"] } },
    },
    {
      $addFields: {
        "payload.Линия": {
          $concat: [
            { $arrayElemAt: ["$codeArray", 0] },
            "-",
            { $arrayElemAt: ["$codeArray", 1] },
          ],
        },
        codeArray: "$$REMOVE",
      },
    },
  ];
}

export function baseVoltageMap(field: string) {
  const voltageMap = {
    "330,0 кВ": "330 кВ",
    "220,0 кВ": "220 кВ",
    "110,0 кВ": "110 кВ",
    "35,0 кВ": "35 кВ",
    "20,0 кВ": "20 кВ",
    "10,0 кВ": "10 кВ",
    "6,0 кВ": "6 кВ",
    "3,0 кВ": "3 кВ",
  };
  let branches: any[] = [];
  for (let name in voltageMap) {
    branches.push({
      case: {
        $eq: [field, name],
      },
      then: { $concat: ["BaseVoltage", voltageMap[name]] },
    });
  }
  return {
    $switch: {
      branches: branches,
      default: { $concat: ["BaseVoltage", field] },
    },
  };
}
