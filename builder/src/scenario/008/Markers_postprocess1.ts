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

    // Джойним model_Entities для определения, что пометка установлена на Terminal
    {
      $lookup: {
        localField: "model.Marker_IdentifiedObject",
        from: "model_Entities",
        foreignField: "initialId",
        as: "model_Entities",
      },
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true,
      },
    },

    //рекурсивным запросом собираем по связям IdentifiedObject_ParentObject всех родителей
    {
      $graphLookup: {
        from: "model_Links",
        startWith: "$model.Marker_IdentifiedObject",
        connectFromField: "toId",
        connectToField: "fromId",
        as: "parents2",
        depthField: "depth",
        restrictSearchWithMatch: {
          $expr: { $eq: ["$predicate", "IdentifiedObject_ParentObject"] },
        },
      },
    },
    {
      $unwind: {
        path: "$parents2",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "parents2.toType": {
          $in: [
            "PowerTransformer",
            "PotentialTransformer",
            "CurrentTransformer",
            "VoltageLevel",
            "BusbarSection",
            "ACLineSegment",
            "Bay",
            "Fuse",
            "SurgeArrester",
            "Breaker",
            "Disconnector",
            "Recloser",
            "GroundDisconnector",
          ],
        },
      },
    },

    // Группируем, т.к. для пометок не относящихся к Terminal выводятся все вышестоящие связи,
    // которые залетают по условию выше
    { $sort: { id: 1, "parents2.depth": 1 } },
    {
      $group: {
        _id: "$id",
        parents2: { $first: "$parents2" },
        model_Entities: { $first: "$model_Entities" },
      },
    },

    // Marker_Equipment = uid оборудования, к которому относится пометка
    // т.е. если пометка стоит на терминале, то Marker_Equipment будет содержать uid оборудования к которому относится терминал
    {
      $project: {
        _id: 0,
        model: {
          "@id": "$_id",
          "@lastSource": "keep",
          Marker_Equipment: {
            "@id": {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$model_Entities.type", "Terminal"] },
                    then: "$parents2.toId",
                  },
                ],
                default: "$model_Entities.initialId",
              },
            },
            "@lastSource": "keep",
          },
        },
      },
    },
  ],
};
