import { Flow, OperationType, SingleStepFlow } from "_sys/classes/Flow";
import * as sysCol from "_sys/collections";

function entitiesPipeline(
  filter: any[],
  entitiesFilter: any[],
  extraFields: any
) {
  return [
    ...filter,
    ...entitiesFilter,
    { $match: { type: { $ne: null } } },
    {
      $project: {
        _id: "$initialId",
        itemType: "entity",
        id: "$initialId",
        extId: "$extId",
        type: true,
        "item.createdAt": "$createdAt",
        "item.changedAt": "$changedAt",
        "item.deletedAt": "$deletedAt",
        lastSource: "$lastSource",
        attr: "$attr",
        ...extraFields,
      },
    },
  ];
}

export function rules(
  outCollection: string,
  addInverseLinks: boolean,
  withNavigationItems: boolean,
  entitiesFilter: any[],
  propertiesFilter: any[]
): SingleStepFlow[] {
  let deletedExtraFields: any = {};
  let linkDeletedAtExpr: any = "$deletedAt";
  if (withNavigationItems) {
    deletedExtraFields = {
      // если объект был в актуальной версии СК-11 он не удаляется, skip - флаг для коннектора
      skip: { $not: { $not: "$attr.skLoadedAt" } },
    };
    linkDeletedAtExpr = {
      $cond: ["$entity.attr.skLoadedAt", "$$REMOVE", "$deletedAt"],
    };
  }

  let list: SingleStepFlow[] = [
    {
      src: __filename,
      input: sysCol.model_Entities,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: entitiesPipeline(
        [
          {
            $match: {
              $and: [
                {
                  createdAt: {
                    $gte: "$$$FROM",
                  },
                },
                {
                  createdAt: {
                    $lt: "$$$TO",
                  },
                },
              ],
            },
          },
          // папки и элементы навигационной структуры всегда проходят как создание, т.к. их могут удалять (не переносить в актуальную версию), см  if (withNavigationItems) ниже
          { $match: { type: { $ne: "Folder" } } },
          { $match: { "model.IdentifiedObject_isLink": { $ne: true } } },
        ],
        entitiesFilter,
        {}
      ),
    },
    {
      src: __filename,
      input: sysCol.model_Entities,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: entitiesPipeline(
        [
          {
            $match: {
              $and: [
                {
                  deletedAt: {
                    $gte: "$$$FROM",
                  },
                },
                {
                  deletedAt: {
                    $lt: "$$$TO",
                  },
                },
              ],
            },
          },
        ],
        entitiesFilter,
        deletedExtraFields
      ),
    },
    {
      src: __filename,
      input: sysCol.model_Links,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: [
        {
          $lookup: {
            from: sysCol.model_Entities,
            localField: "fromId",
            foreignField: "id",
            as: "entity",
          },
        },
        { $unwind: "$entity" },
        ...propertiesFilter,
        {
          $project: {
            _id: "$linkId",
            itemType: "link",
            type: "$fromType",
            id: "$fromId",
            predicate: "$predicate",
            value: "$toId",
            "item.createdAt": "$createdAt",
            "item.changedAt": "$changedAt",
            "item.deletedAt": linkDeletedAtExpr,
          },
        },
      ],
    },
    {
      src: __filename,
      input: sysCol.model_Fields,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: [
        {
          $lookup: {
            from: sysCol.model_Entities,
            localField: "id",
            foreignField: "id",
            as: "entity",
          },
        },
        { $unwind: "$entity" },
        ...propertiesFilter,
        {
          $project: {
            _id: "$fieldId",
            itemType: "field",
            type: true,
            id: true,
            predicate: true,
            value: true,
            "item.createdAt": "$createdAt",
            "item.changedAt": "$changedAt",
            "item.deletedAt": "$deletedAt",
          },
        },
      ],
    },
  ];

  if (withNavigationItems) {
    list.push({
      src: __filename,
      input: sysCol.model_Entities,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: entitiesPipeline(
        [
          {
            $match: {
              $and: [
                {
                  changedAt: {
                    $gte: "$$$FROM",
                  },
                },
                {
                  changedAt: {
                    $lt: "$$$TO",
                  },
                },
              ],
            },
          },
          // папки и элементы навигационной структуры всегда проходят как создание, т.к. их могут удалять (не переносить в актуальную версию)
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$model.IdentifiedObject_isLink", true] },
                  { $eq: ["$type", "Folder"] },
                ],
              },
            },
          },
        ],
        entitiesFilter,
        {}
      ),
    });

    list.push({
      src: __filename,
      input: sysCol.model_Entities,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: [
        {
          $match: {
            $and: [
              {
                deletedAt: {
                  $gte: "$$$FROM",
                },
              },
              {
                deletedAt: {
                  $lt: "$$$TO",
                },
              },
            ],
          },
        },
        ...entitiesFilter,
        { $match: { $expr: "$attr.skLoadedAt" } },
        {
          $project: {
            _id: { $concat: ["$initialId", "-deleted-mark"] },
            itemType: "field",
            type: true,
            id: "$initialId",
            predicate: "IdentifiedObject_name",
            value: {
              $concat: [
                { $ifNull: ["$model.IdentifiedObject_name", ""] },
                " (Удален в SAP)",
              ],
            },
            "item.createdAt": "$createdAt",
            "item.changedAt": "$changedAt",
          },
        },
      ],
    });
  }

  if (addInverseLinks) {
    list.push({
      src: __filename,
      input: sysCol.model_Links,
      output: outCollection,
      operationType: OperationType.sync,
      pipeline: [
        {
          $lookup: {
            from: sysCol.model_Entities,
            localField: "fromId",
            foreignField: "id",
            as: "entity",
          },
        },
        { $unwind: "$entity" },
        ...propertiesFilter,
        { $match: { inversePredicate: { $ne: null } } },
        {
          $project: {
            _id: {
              $concat: ["$linkId", "-inv"],
            },
            itemType: "link",
            type: "$toType",
            id: "$toId",
            predicate: "$inversePredicate",
            value: "$fromId",
            "item.createdAt": "$createdAt",
            "item.changedAt": "$changedAt",
            "item.deletedAt": "$deletedAt",
          },
        },
      ],
    });
  }
  return list;
}
