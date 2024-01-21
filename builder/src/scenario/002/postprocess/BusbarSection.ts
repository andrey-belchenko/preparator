import { Flow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";
import * as cols from "collections";
export const flow: Flow = {
  src: __filename,
  input: cols.dm_BusbarSection,
  output: sysCol.model_Input,
  pipeline: [
    // для фиктивных СШ нижестоящие оборудование переносится на родительский элемент
    {$match:{$expr:{$not:"$deletedAt"}}},
    {
      $addFields: {
        newParent: {
          $switch: {
            branches: [
              {
                case: "$model.BusbarSection_isFake",
                then: "$model.IdentifiedObject_ParentObject",
              },
            ],
            default: "$id",
          },
        },
      },
    },
    // подтягиваем детей по связи OriginalParentObject
    {
      $lookup: {
        from: "model_Links",
        let: { id: "$id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$toId", "$$id"],
              },
            },
          },
          { $match: { predicate: "IdentifiedObject_OriginalParentObject" } },
        ],
        as: "child",
      },
    },
    { $unwind: "$child" },
    // подтягиваем их текущих родителей по ParentObject
    {
      $lookup: {
        from: "model_Links",
        let: {
          id: "$child.fromId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$fromId", "$$id"],
              },
            },
          },
          {
            $match: {
              predicate: "IdentifiedObject_ParentObject",
            },
          },
        ],
        as: "currentParentLink",
      },
    },
    {
      $unwind: "$currentParentLink",
    },
     // Если текущий родитель из СК , то исключаем
    {
      $match: { $expr: { $not: { $eq: ["$currentParentLink.lastSource", "sk11"] } } },
    },
    // Если текущий родитель уже совпадает с целевым значением - исключаем
    {
      $match: { $expr: { $ne: ["$currentParentLink.toId", "$newParent"] } },
    },
    {
      $project: {
        model: {
          "@id": "$child.fromId",
          "@idSource": "platform",
          "@action": "link",
          Equipment_EquipmentContainer: {
            "@action": "link",
            "@idSource": "platform",
            "@id": "$newParent",
          },
          IdentifiedObject_ParentObject: {
            "@action": "link",
            "@idSource": "platform",
            "@id": "$newParent",
          },
        },
      },
    },
  ],
};
