import { Flow } from "_sys/classes/Flow";
import * as col from "collections";

export const flow: Flow = {
  src: __filename,
  input: col.dm_Marker,
  output: col.out_rgis_add_all,
  idSource: "platform",
  pipeline: [
    {
      $match:
        { id: { $not: { $regex: "deleted" } } }
    },
    {
      $lookup: {
        localField: "model.Marker_CreatedBy",
        from: "dm_Person",
        foreignField: "id",
        as: "Person"
      }
    },
    {
      $unwind: {
        path: "$Person",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        localField: "model.Marker_TypeMarker",
        from: "dm_MarkerType",
        foreignField: "id",
        as: "MarkerType"
      }
    },
    {
      $unwind: {
        path: "$MarkerType",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        localField: "model.Marker_EquipmentContainer",
        from: "model_Entities",
        foreignField: "id",
        as: "EquipmentContainer"
      }
    },
    {
      $unwind: {
        path: "$EquipmentContainer",
        preserveNullAndEmptyArrays: true
      }
    },

    // Выбираем первое не пропущенное поле для последующего джойна model_Entities
    // Marker_Equipment - для пометок терминала.
    // Marker_IdentifiedObject - для пометок оборудования.
    { $addFields: { Marker_IdentifiedObject: { $ifNull: ["$model.Marker_Equipment", "$model.Marker_IdentifiedObject"] } }, },
    {
      $lookup: {
        localField: "Marker_IdentifiedObject",
        from: "model_Entities",
        foreignField: "initialId",
        as: "model_Entities"
      }
    },
    {
      $unwind: {
        path: "$model_Entities",
        preserveNullAndEmptyArrays: true
      }
    },

    // Маппинг терминала
    {
      $lookup: {
        from: "model_Entities",
        let: { id: { $ifNull: ["$model.Marker_IdentifiedObject", "-"] } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$initialId", "$$id"] },
                  { $eq: ["$type", "Terminal"] },
                ],
              },
            },
          },
        ],
        as: "model_Entities_terminal",
      },
    },
    {
      $unwind: {
        path: "$model_Entities_terminal",
        preserveNullAndEmptyArrays: true
      }
    },

    // Маппинг русского названия класса контейнера
    {
      $lookup: {
        localField: "EquipmentContainer.type",
        from: "data_ClassesTranslation",
        foreignField: "NameCIM",
        as: "EquipmentContainerClassesTranslation"
      }
    },
    {
      $unwind: {
        path: "$EquipmentContainerClassesTranslation",
        preserveNullAndEmptyArrays: true
      }
    },

    // Маппинг русского названия класса оборудования
    {
      $lookup: {
        localField: "model_Entities.type",
        from: "data_ClassesTranslation",
        foreignField: "NameCIM",
        as: "model_EntitiesClassesTranslation"
      }
    },
    {
      $unwind: {
        path: "$model_EntitiesClassesTranslation",
        preserveNullAndEmptyArrays: true
      }
    },

    // КодСобытия
    {
      $addFields:
      {
        КодСобытия:
        {
          $cond:
          {
            if: { $regexMatch: { input: "$id", regex: "deleted" } },
            then: "УдалениеДиспетчерскойПометки",
            else: "ПередачаДиспетчерскойПометки",
          },
        },
      },
    },

    // исключаем из передачи в РГИС пометки, если для них не определен КодТехническогоОбъекта
    {
      $match: {
        $or: [
          { EquipmentContainer: { $ne: null } }, // если известен объект контейнер
          {
            $and: [
              { model_Entities: { $ne: null } }, // если объект контейнер существует в model_Entities
              { "model_Entities.type": { $in: ["Line", "Substation"] } },
            ]
          }
        ]
      }
    },

    // группировка тела сообщения 
    {
      $group:
      {
        _id: {
          КодСобытия: "$КодСобытия",
          ДатаФормированияСообщения: "$$NOW",
          СистемаИсточник: "ЕИП"
        },
        Тело: {
          $push:
          {
            КодПометки: "$initialId",
            КодТехническогоОбъекта:
            {
              $switch: {
                branches: [
                  { case: { $lte: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_Entities.model.PowerSystemResource_ccsCode", null] } },
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$EquipmentContainer.model.PowerSystemResource_ccsCode", null] } },
                ], default: null
              }
            },

            НаименованиеТехнОбъекта:
            {
              $switch: {
                branches: [
                  { case: { $lte: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_Entities.model.IdentifiedObject_name", null] } },
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$EquipmentContainer.model.IdentifiedObject_name", null] } },
                ], default: null
              }
            },

            ТипТехническогоОбъектаCIM:
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$EquipmentContainer.type", null] } },
                  { case: { $in: ["$model_Entities.type", ["Line", "Substation"]] }, then: { $ifNull: ["$model_Entities.type", null] } },
                ], default: null
              }
            },

            ТипТехническогоОбъекта:
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$EquipmentContainerClassesTranslation.NameRus", null] } },
                  { case: { $in: ["$model_Entities.type", ["Line", "Substation"]] }, then: { $ifNull: ["$model_EntitiesClassesTranslation.NameRus", null] } },
                ], default: null
              }
            },

            КодОборудования:
            {
              $switch: {
                branches: [
                  { case: { $eq: ["$model_Entities.type", "ACLineSegment"] }, then: { $ifNull: ["$model_Entities.initialId", null] } },
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_Entities.model.PowerSystemResource_ccsCode", null] } },
                ], default: '$null'
              }
            },

            НаименованиеОборудования:
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_Entities.model.IdentifiedObject_name", null] } },
                ], default: '$null'
              }
            },

            ТипОборудованияCIM:
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_Entities.type", null] } },
                ], default: '$null'
              }
            },

            ТипОборудования:
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$EquipmentContainer", null] }, then: { $ifNull: ["$model_EntitiesClassesTranslation.NameRus", null] } },
                ], default: '$null'
              }
            },
            Тип: "$MarkerType.model.IdentifiedObject_name",
            КодТипа: "$MarkerType.initialId",
            Время: "$model.Marker_TimeCreated",
            Комментарий: {
              $switch: {
                branches: [
                  // Если пометка установлена на полюс, то пишем об этом в поле Комментарий
                  // это временное решение и в дальнейшем информацию об этом стоит вынести в отдельное поле
                  // TO DO!!!! данный комментарий отправляется только в РГИС, и отсутствует в Платформе !!!! 
                  {
                    case: { $eq: ["$model_Entities_terminal.type", "Terminal"] },
                    then: {
                      $concat: [
                        "Пометка установлена на Полюс ", { $toString: "$model_Entities_terminal.model.ACDCTerminal_sequenceNumber" }, ". ",
                        "$model.Marker_Text"
                      ]
                    }
                  },
                ], default: "$model.Marker_Text"
              }
            },
            АвторПометки: "$Person.model.IdentifiedObject_name",
          },
        },
      },
    },
    {
      $project: {
        _id: false,
        queueName: "DISPATCHER_TAG.ASTU.IN",
        payload: {
          ИдСообщения: "$_id.ИдСообщения", 
          КодСобытия: "$_id.КодСобытия",
          ДатаФормированияСообщения: "$_id.ДатаФормированияСообщения",
          СистемаИсточник: "$_id.СистемаИсточник",
          Тело: "$Тело",
        }
      }
    }
  ],
};

