import * as sysCol from "_sys/collections";
import * as col from "collections";

const transformEnabled = true;
export const validRegions = ["3600R027", "3600R030"];
export const validRegionExpr = {
  $or: [
    // в сообщениях по оборудованию ПС и контейнерах
    { $in: ["$payload.body.res", validRegions] },
    // в сообщениях по оборудованию на линях
    { $in: ["$payload.body.element.res", validRegions] },
    // в сообщениях по ТУ ПУ
    { $in: ["$payload.body.customAttributes.resCode", validRegions] },
  ],
};
// export const validRegionExpr = true;

export const validSupplyCenters = [
  "PS035-001986", // ПС 35 кВ Землянск
  "PS035-001983", // ПС 35 кВ Верейка
  "PS035-001957", // ПС 35 кВ Березовка
];

export function addTransformSteps(steps: any[]): any[] {
  if (!transformEnabled) {
    return [];
  }
  return [...steps];
}

export function resFilterSteps(): any[] {
  return [
    {
      $match: {
        $expr: validRegionExpr,
      },
    },
  ];
}

export function rootCodeSteps(baseCodeExpr: any): any[] {
  return [
    {
      $addFields: {
        _code: baseCodeExpr,
      },
    },
    {
      $addFields: {
        _codeArray: {
          $split: ["$_code", "-"],
        },
      },
    },
    {
      $addFields: {
        rootCode: {
          $concat: [
            { $arrayElemAt: ["$_codeArray", 0] },
            "-",
            { $arrayElemAt: ["$_codeArray", 1] },
          ],
        },
      },
    },
    { $unset: ["_code", "_codeArray"] },
  ];
}

export function isValidSupplyCenterSteps(): any[] {
  return [
    // у ЛЭП 0.4 код не начинается с кода ТП поэтому сначала пытаемся взять код из payload.body.cell
    ...rootCodeSteps({
      $ifNull: ["$payload.body.cell", "$payload.body.code"],
    }),
    {
      $lookup: {
        from: sysCol.sys_IncomingMessages,
        localField: "rootCode",
        foreignField: "payload.body.code",
        as: "rootMsg",
      },
    },
    {
      $unwind: {
        path: "$rootMsg",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: col.dm_Substation,
        localField: "rootCode",
        foreignField: "extId.КИСУР",
        as: "rootObj",
      },
    },
    {
      $unwind: {
        path: "$rootObj",
        preserveNullAndEmptyArrays: true,
      },
    },
    // пытаемся достать код питающего центра из сообщения или из модели
    // вариант получения из сообщения нужен, потому что ТП может быть еще не записана в хранилище
    // если нет ни того ни другого, проверяем может быть сам rootCode является допустимым питающим центром
    {
      $addFields: {
        supplyCenterCode: {
          $ifNull: [
            "$rootMsg.payload.body.con_supplycenter",
            "$rootObj.model.Substation_supplyCenterCode",
            "$rootCode",
          ],
        },
      },
    },
    {
      $addFields: {
        isValidSupplyCenter: {
          $or: [
            {
              $in: ["$supplyCenterCode", validSupplyCenters],
            },
            {
              // для элементов сети, ПУ, ТУ фильтр не применяется, но статус Пропущено: Исключенный питающий центр вылез в логе сообщений
              $in: [
                "$eventId",
                [
                  "РазделениеУчасткаМагистралиКА",
                  "СозданиеУчасткаМагистрали",
                  "СозданиеОтпайки",
                  "meter",
                  "usagePoint"
                ],
              ],
            },
          ],
        },
      },
    },
    { $unset: ["rootMsg", "rootObj", "supplyCenterCode"] },
  ];
}

export function filterSteps(): any[] {
  return [
    ...resFilterSteps(),
    ...isValidSupplyCenterSteps(),
    {
      $match: {
        $expr: "$isValidSupplyCenter",
      },
    },
  ];
}
