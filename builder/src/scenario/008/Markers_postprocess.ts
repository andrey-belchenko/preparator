import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.dm_Marker,
  output: sysCol.model_Input,
  idSource: "platform",
  pipeline: [
    { $match: { $expr: "$model.Marker_IdentifiedObject" } },
    {
      //рекурсивным запросом собираем по связям IdentifiedObject_ParentObject всех родителей
      //останавливаемся если нашли Substation
      $graphLookup: {
        from: sysCol.model_Links,
        startWith: "$model.Marker_IdentifiedObject",
        connectFromField: "toId",
        connectToField: "fromId",
        as: "parents",
        depthField: "depth",
        restrictSearchWithMatch: {
          $expr: { $eq: ["$predicate", "IdentifiedObject_ParentObject"] },
        },
      },
    },
    {
      $unwind: {
        path: "$parents",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $match: { "parents.toType": { $in: ["Line", "Substation"] } } },
    //создаем связь Marker_EquipmentContainer
    {
      $project: {
        model: {
          "@id": "$id",
          "@lastSource": "keep",
          Marker_EquipmentContainer: {
            "@id": "$parents.toId",
            "@lastSource": "keep",
          },
        },
      },
    },
  ],
};
